require('dotenv').config();

const mongoose = require('mongoose');
const Match = require('../server/models/Match');

async function main() {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI is required.');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);

  const now = new Date();
  const result = await Match.updateMany(
    {
      matchDate: { $gt: now },
      resultSet: false
    },
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
        resultSource: ''
      }
    }
  );

  await mongoose.disconnect();
  console.log(`Cleared ${result.modifiedCount} future matches.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
