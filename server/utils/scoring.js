const Match = require('../models/Match');
const Prediction = require('../models/Prediction');
const Entry = require('../models/Entry');
const User = require('../models/User');
const { getAppSettings } = require('./appSettings');
const { ensureUserEntries } = require('./entries');
const { getMatchScoreState } = require('./matchResolution');
const {
  buildPredictionMap,
  buildResolutionContext,
  resolveMatchTeams,
  calculateGroupBonus,
  calculateKnockoutBonus
} = require('./tournament');

function outcome(scoreA, scoreB) {
  if (scoreA === scoreB) return 'draw';
  return scoreA > scoreB ? 'teamA' : 'teamB';
}

function isExactKnockoutBracket(match, actualContext, predictedContext) {
  if (!match || match.stage === 'group' || !actualContext || !predictedContext) {
    return true;
  }

  const actualTeams = resolveMatchTeams(match, actualContext);
  const predictedTeams = resolveMatchTeams(match, predictedContext);

  if (!actualTeams.teamA || !actualTeams.teamB || !predictedTeams.teamA || !predictedTeams.teamB) {
    return false;
  }

  return (
    actualTeams.teamA === predictedTeams.teamA &&
    actualTeams.teamB === predictedTeams.teamB
  );
}

function calculateMatchPoints(prediction, match, options = {}) {
  const {
    actualContext = null,
    predictedContext = null
  } = options;
  const scoreState = getMatchScoreState(match, options);
  if (!scoreState.played) return 0;

  const exactScore =
    prediction.predictedScoreA === scoreState.scoreA &&
    prediction.predictedScoreB === scoreState.scoreB;

  if (exactScore && isExactKnockoutBracket(match, actualContext, predictedContext)) return 3;

  const predictedOutcome = outcome(
    prediction.predictedScoreA,
    prediction.predictedScoreB
  );
  const realOutcome = outcome(scoreState.scoreA, scoreState.scoreB);

  return predictedOutcome === realOutcome ? 1 : 0;
}

async function recalculateAllScores() {
  const [matches, predictions, users, settings] = await Promise.all([
    Match.find().lean(),
    Prediction.find().lean(),
    User.find().select('_id username avatarPreset avatarImage predictedWorstTeam isPaid').lean(),
    getAppSettings()
  ]);

  const matchById = new Map(matches.map((match) => [String(match._id), match]));
  const predictionsByEntry = new Map();
  const orphanPredictions = [];

  predictions.forEach((prediction) => {
    const entryId = prediction.entry ? String(prediction.entry) : '';
    if (!entryId) {
      orphanPredictions.push(prediction);
      return;
    }

    if (!predictionsByEntry.has(entryId)) predictionsByEntry.set(entryId, []);
    predictionsByEntry.get(entryId).push(prediction);
  });

  const actualContext = buildResolutionContext(matches);
  const scoringContexts = new Map();

  predictionsByEntry.forEach((entryPredictions, entryId) => {
    scoringContexts.set(entryId, buildResolutionContext(matches, buildPredictionMap(entryPredictions)));
  });

  if (orphanPredictions.length) {
    scoringContexts.set('__orphan__', buildResolutionContext(matches, buildPredictionMap(orphanPredictions)));
  }

  const predictionWrites = [];

  predictions.forEach((prediction) => {
    const match = matchById.get(String(prediction.match));
    const entryId = prediction.entry ? String(prediction.entry) : '__orphan__';
    const predictedContext = scoringContexts.get(entryId) || null;
    const scoreState = getMatchScoreState(match, { includeLive: true });
    const nextPoints = match && scoreState.played
      ? calculateMatchPoints(prediction, match, { actualContext, predictedContext })
      : 0;
    const nextScored = Boolean(match && scoreState.played);

    if (Number(prediction.points || 0) !== nextPoints || Boolean(prediction.scored) !== nextScored) {
      predictionWrites.push({
        updateOne: {
          filter: { _id: prediction._id },
          update: {
            $set: {
              points: nextPoints,
              scored: nextScored
            }
          }
        }
      });
    }

    prediction.points = nextPoints;
    prediction.scored = nextScored;
  });

  if (predictionWrites.length) {
    await Prediction.bulkWrite(predictionWrites, { ordered: false });
  }

  const userContexts = new Map();
  await Promise.all(
    users.map(async (user) => {
      const context = await ensureUserEntries(user);
      userContexts.set(String(user._id), context);
    })
  );

  const entryPredictionsByEntry = new Map();

  predictions.forEach((prediction) => {
    const entryId = prediction.entry ? String(prediction.entry) : '';

    if (entryId) {
      if (!entryPredictionsByEntry.has(entryId)) entryPredictionsByEntry.set(entryId, []);
      entryPredictionsByEntry.get(entryId).push(prediction);
    }
  });

  const entryWrites = [];
  const userWrites = [];

  for (const user of users) {
    const userId = String(user._id);
    const context = userContexts.get(userId);
    const entries = context?.entries || [];
    let userTotal = 0;

    for (const entry of entries) {
      const entryId = String(entry._id);
      const entryPredictions = entryPredictionsByEntry.get(entryId) || [];
      let entryTotal = 0;

      entryPredictions.forEach((prediction) => {
        if (!prediction.scored) return;
        entryTotal += Number(prediction.points || 0);
      });

      const predictedContext = buildResolutionContext(matches, buildPredictionMap(entryPredictions));
      entryTotal +=
        calculateGroupBonus(actualContext, predictedContext) +
        calculateKnockoutBonus(matches, actualContext, predictedContext) +
        (settings.actualWorstTeam && String(entry.predictedWorstTeam || '') === String(settings.actualWorstTeam) ? 5 : 0);

      userTotal += entryTotal;

      if (Number(entry.totalPoints || 0) !== entryTotal) {
        entryWrites.push({
          updateOne: {
            filter: { _id: entry._id },
            update: {
              $set: { totalPoints: entryTotal }
            }
          }
        });
      }
    }

    if (Number(user.totalPoints || 0) !== userTotal) {
      userWrites.push({
        updateOne: {
          filter: { _id: user._id },
          update: {
            $set: { totalPoints: userTotal }
          }
        }
      });
    }
  }

  if (entryWrites.length) {
    await Entry.bulkWrite(entryWrites, { ordered: false });
  }

  if (userWrites.length) {
    await User.bulkWrite(userWrites, { ordered: false });
  }
}

module.exports = { calculateMatchPoints, recalculateAllScores };
