require('dotenv').config();

const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const Match = require('../server/models/Match');
const Prediction = require('../server/models/Prediction');
const User = require('../server/models/User');
const { recalculateAllScores } = require('../server/utils/scoring');

function makeRng(seed) {
  let value = seed % 2147483647;
  if (value <= 0) value += 2147483646;
  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

function randInt(rng, min, max) {
  return Math.floor(rng() * (max - min + 1)) + min;
}

async function upsertUser(username, password) {
  const hashedPassword = await bcrypt.hash(password, 12);
  const existing = await User.findOne({ username: new RegExp(`^${username}$`, 'i') });

  if (existing) {
    existing.username = username;
    existing.password = hashedPassword;
    existing.totalPoints = 0;
    await existing.save();
    return existing;
  }

  return User.create({
    username,
    password: hashedPassword,
    totalPoints: 0
  });
}

async function main() {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI is required.');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);

  const username = 'James S';
  const password = 'ilovemadre1';
  const rng = makeRng(20260606);

  const user = await upsertUser(username, password);
  const matches = await Match.find().sort({ matchDate: 1, code: 1 });

  await Prediction.deleteMany({ user: user._id });

  const predictions = matches.map((match) => {
    const scoreA = randInt(rng, 0, 4);
    const scoreB = randInt(rng, 0, 4);
    let predictedQualifiedTeam = '';

    if (match.stage !== 'group') {
      if (scoreA === scoreB) {
        predictedQualifiedTeam = randInt(rng, 0, 1) === 0 ? 'teamA' : 'teamB';
      } else {
        predictedQualifiedTeam = scoreA > scoreB ? 'teamA' : 'teamB';
      }
    }

    return {
      user: user._id,
      match: match._id,
      predictedScoreA: scoreA,
      predictedScoreB: scoreB,
      predictedQualifiedTeam
    };
  });

  await Prediction.insertMany(predictions);
  await recalculateAllScores();

  const refreshedUser = await User.findById(user._id).select('username totalPoints');
  const predictionCount = await Prediction.countDocuments({ user: user._id });

  await mongoose.disconnect();

  console.log(
    JSON.stringify(
      {
        user: refreshedUser,
        predictionsInserted: predictionCount,
        matchesCovered: matches.length
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
