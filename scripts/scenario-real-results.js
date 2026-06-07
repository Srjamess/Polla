require('dotenv').config();

const mongoose = require('mongoose');
const Match = require('../server/models/Match');
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

async function main() {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI is required.');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);

  const rng = makeRng(20260610);
  const matches = await Match.find().sort({ matchDate: 1, code: 1 });

  for (const match of matches) {
    const scoreA = randInt(rng, 0, 4);
    const scoreB = randInt(rng, 0, 4);
    let qualifiedTeam = '';

    if (match.stage !== 'group') {
      if (scoreA === scoreB) {
        qualifiedTeam = randInt(rng, 0, 1) === 0 ? 'teamA' : 'teamB';
      } else {
        qualifiedTeam = scoreA > scoreB ? 'teamA' : 'teamB';
      }
    }

    await Match.findByIdAndUpdate(
      match._id,
      {
        $set: {
          scoreA,
          scoreB,
          resultSet: true,
          qualifiedTeam
        }
      },
      { new: true, runValidators: true }
    );
  }

  await recalculateAllScores();

  const updatedMatches = await Match.find().sort({ matchDate: 1 });
  const resultSetMatches = updatedMatches.filter((match) => match.resultSet).length;

  await mongoose.disconnect();

  console.log(
    JSON.stringify(
      {
        matchesUpdated: matches.length,
        resultSetMatches
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
