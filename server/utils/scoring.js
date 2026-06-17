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
  calculateGroupBonus,
  calculateKnockoutBonus
} = require('./tournament');

function outcome(scoreA, scoreB) {
  if (scoreA === scoreB) return 'draw';
  return scoreA > scoreB ? 'teamA' : 'teamB';
}

function calculateMatchPoints(prediction, match, options = {}) {
  const scoreState = getMatchScoreState(match, options);
  if (!scoreState.played) return 0;

  const exactScore =
    prediction.predictedScoreA === scoreState.scoreA &&
    prediction.predictedScoreB === scoreState.scoreB;

  if (exactScore) return 3;

  const predictedOutcome = outcome(
    prediction.predictedScoreA,
    prediction.predictedScoreB
  );
  const realOutcome = outcome(scoreState.scoreA, scoreState.scoreB);

  return predictedOutcome === realOutcome ? 1 : 0;
}

async function recalculateAllScores() {
  const [matches, predictions, users, settings] = await Promise.all([
    Match.find(),
    Prediction.find(),
    User.find().select('_id predictedWorstTeam'),
    getAppSettings()
  ]);

  const matchById = new Map(matches.map((match) => [String(match._id), match]));

  await Promise.all(
    predictions.map(async (prediction) => {
      const match = matchById.get(String(prediction.match));
      const scoreState = getMatchScoreState(match, { includeLive: true });

      if (!match || !scoreState.played) {
        prediction.points = 0;
        prediction.scored = false;
      } else {
        prediction.points = calculateMatchPoints(prediction, match);
        prediction.scored = true;
      }

      await prediction.save();
    })
  );

  const userContexts = new Map();
  await Promise.all(
    users.map(async (user) => {
      const context = await ensureUserEntries(user);
      userContexts.set(String(user._id), context);
    })
  );

  const refreshedPredictions = await Prediction.find();
  const predictionsByEntry = new Map();

  refreshedPredictions.forEach((prediction) => {
    const entryId = prediction.entry ? String(prediction.entry) : '';

    if (entryId) {
      if (!predictionsByEntry.has(entryId)) predictionsByEntry.set(entryId, []);
      predictionsByEntry.get(entryId).push(prediction);
    }
  });

  const actualContext = buildResolutionContext(matches);
  const totalsByEntry = new Map();
  const totalsByUser = new Map(users.map((user) => [String(user._id), 0]));

  for (const user of users) {
    const userId = String(user._id);
    const context = userContexts.get(userId);
    const entries = context?.entries || [];

    for (const entry of entries) {
      const entryId = String(entry._id);
      const entryPredictions = predictionsByEntry.get(entryId) || [];
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

      totalsByEntry.set(entryId, entryTotal);
      totalsByUser.set(userId, (totalsByUser.get(userId) || 0) + entryTotal);
    }
  }

  await Promise.all(
    [...totalsByEntry.entries()].map(([entryId, totalPoints]) =>
      Entry.findByIdAndUpdate(entryId, { totalPoints })
    )
  );

  await Promise.all(
    [...totalsByUser.entries()].map(([userId, totalPoints]) =>
      User.findByIdAndUpdate(userId, { totalPoints })
    )
  );
}

module.exports = { calculateMatchPoints, recalculateAllScores };
