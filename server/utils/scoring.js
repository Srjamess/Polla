const Match = require('../models/Match');
const Prediction = require('../models/Prediction');
const User = require('../models/User');
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

function calculateMatchPoints(prediction, match) {
  const exactScore =
    prediction.predictedScoreA === match.scoreA &&
    prediction.predictedScoreB === match.scoreB;

  if (exactScore) return 3;

  const predictedOutcome = outcome(
    prediction.predictedScoreA,
    prediction.predictedScoreB
  );
  const realOutcome = outcome(match.scoreA, match.scoreB);

  return predictedOutcome === realOutcome ? 1 : 0;
}

async function recalculateAllScores() {
  const [matches, predictions, users] = await Promise.all([
    Match.find(),
    Prediction.find(),
    User.find().select('_id')
  ]);

  const matchById = new Map(matches.map((match) => [String(match._id), match]));

  await Promise.all(
    predictions.map(async (prediction) => {
      const match = matchById.get(String(prediction.match));

      if (!match || !match.resultSet) {
        prediction.points = 0;
        prediction.scored = false;
      } else {
        prediction.points = calculateMatchPoints(prediction, match);
        prediction.scored = true;
      }

      await prediction.save();
    })
  );

  const refreshedPredictions = await Prediction.find();
  const predictionsByUser = new Map();

  refreshedPredictions.forEach((prediction) => {
    const userId = String(prediction.user);
    if (!predictionsByUser.has(userId)) predictionsByUser.set(userId, []);
    predictionsByUser.get(userId).push(prediction);
  });

  const actualContext = buildResolutionContext(matches);
  const totalsByUser = new Map(users.map((user) => [String(user._id), 0]));

  refreshedPredictions.forEach((prediction) => {
    if (!prediction.scored) return;
    const userId = String(prediction.user);
    totalsByUser.set(userId, (totalsByUser.get(userId) || 0) + prediction.points);
  });

  users.forEach((user) => {
    const userId = String(user._id);
    const userPredictions = predictionsByUser.get(userId) || [];
    const predictedContext = buildResolutionContext(matches, buildPredictionMap(userPredictions));
    const bonusPoints =
      calculateGroupBonus(actualContext, predictedContext) +
      calculateKnockoutBonus(matches, actualContext, predictedContext);

    totalsByUser.set(userId, (totalsByUser.get(userId) || 0) + bonusPoints);
  });

  await Promise.all(
    [...totalsByUser.entries()].map(([userId, totalPoints]) =>
      User.findByIdAndUpdate(userId, { totalPoints })
    )
  );
}

module.exports = { calculateMatchPoints, recalculateAllScores };
