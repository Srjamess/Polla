require('dotenv').config();

const mongoose = require('mongoose');
const Match = require('../server/models/Match');
const Prediction = require('../server/models/Prediction');
const User = require('../server/models/User');

async function resetPruebas() {
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
        resultSet: false,
        qualifiedTeam: ''
      }
    }
  );

  const predictionDelete = await Prediction.deleteMany({});
  const userUpdate = await User.updateMany({}, { $set: { totalPoints: 0 } });

  await mongoose.disconnect();

  console.log(
    `Prueba reset complete. Matches updated: ${matchUpdate.modifiedCount}. Predictions deleted: ${predictionDelete.deletedCount}. Users reset: ${userUpdate.modifiedCount}.`
  );
}

resetPruebas().catch((error) => {
  console.error(error);
  process.exit(1);
});
