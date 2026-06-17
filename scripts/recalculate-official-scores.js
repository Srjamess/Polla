require('dotenv').config();

const mongoose = require('mongoose');
const { recalculateAllScores } = require('../server/utils/scoring');

async function main() {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI is required.');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  await recalculateAllScores();
  await mongoose.disconnect();

  console.log('Official scores recalculated.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
