require('dotenv').config();

const mongoose = require('mongoose');
const Match = require('../server/models/Match');
const Entry = require('../server/models/Entry');
const Prediction = require('../server/models/Prediction');
const User = require('../server/models/User');

async function resetTestData() {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI is required.');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);

  const matchUpdate = await Match.updateMany(
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

  const predictionDelete = await Prediction.deleteMany({});
  const entryUpdate = await Entry.updateMany({}, { $set: { totalPoints: 0, predictedWorstTeam: '', isPaid: false } });
  const userUpdate = await User.updateMany({}, { $set: { totalPoints: 0, isPaid: false } });

  await mongoose.disconnect();

  console.log(
    `Reset complete. Matches updated: ${matchUpdate.modifiedCount}. Predictions deleted: ${predictionDelete.deletedCount}. Entries reset: ${entryUpdate.modifiedCount}. Users reset: ${userUpdate.modifiedCount}.`
  );
}

resetTestData().catch((error) => {
  console.error(error);
  process.exit(1);
});
