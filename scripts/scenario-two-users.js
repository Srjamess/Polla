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

async function ensureFreshUser(username, password) {
  const hashedPassword = await bcrypt.hash(password, 12);
  const existing = await User.findOne({ username });

  if (existing) {
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

  await Prediction.deleteMany({});
  await User.updateMany({}, { $set: { totalPoints: 0 } });
  await Match.updateMany(
    {},
    {
      $set: {
        scoreA: null,
        scoreB: null,
        liveScoreA: null,
        liveScoreB: null,
        liveMinute: '',
        liveStatus: '',
        liveQualifiedTeam: '',
        liveUpdatedAt: null,
        resultSet: false,
        qualifiedTeam: '',
        resultSource: ''
      }
    }
  );

  const allMatches = await Match.find().sort({ matchDate: 1 });
  const cutoff = new Date('2026-06-27T22:00:00-04:00');
  const groupMatches = allMatches.filter((match) => match.stage === 'group' && new Date(match.matchDate) <= cutoff);
  const futureMatches = allMatches.filter((match) => new Date(match.matchDate) > cutoff);
  const rng = makeRng(20260607);

  for (const match of groupMatches) {
    const scoreA = randInt(rng, 0, 4);
    const scoreB = randInt(rng, 0, 4);
    await Match.findByIdAndUpdate(
      match._id,
      {
        scoreA,
        scoreB,
        resultSet: true,
        qualifiedTeam: '',
        liveScoreA: null,
        liveScoreB: null,
        liveMinute: '',
        liveStatus: 'finished',
        liveQualifiedTeam: '',
        liveUpdatedAt: null,
        resultSource: 'manual'
      },
      { new: true, runValidators: true }
    );
  }

  const users = [];
  for (let index = 1; index <= 2; index += 1) {
    const username = `prueba2_${index}_${Date.now()}_${index}`;
    const password = 'Test1234!';
    const user = await ensureFreshUser(username, password);
    users.push({ username, password, id: String(user._id) });
  }

  for (const user of users) {
    const predictions = [];

    for (const match of allMatches) {
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

      predictions.push({
        user: user.id,
        match: String(match._id),
        predictedScoreA: scoreA,
        predictedScoreB: scoreB,
        predictedQualifiedTeam
      });
    }

    await Prediction.insertMany(predictions);
  }

  await recalculateAllScores();

  const refreshedUsers = await User.find().select('username totalPoints').sort({ totalPoints: -1, username: 1 });
  const updatedMatches = await Match.find().sort({ matchDate: 1 });
  const lockedAfterCutoff = updatedMatches.filter((match) => match.resultSet).length;

  await mongoose.disconnect();

  console.log(JSON.stringify({
    createdUsers: users,
    groupResultsSet: groupMatches.length,
    futureMatchesPending: futureMatches.length,
    resultSetMatches: lockedAfterCutoff,
    leaderboardPreview: refreshedUsers.slice(0, 8)
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
