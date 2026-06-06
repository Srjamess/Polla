require('dotenv').config();

const { seed, groupStage } = require('./seed-matches');

seed(groupStage, 'group stage matches').catch((error) => {
  console.error(error);
  process.exit(1);
});
