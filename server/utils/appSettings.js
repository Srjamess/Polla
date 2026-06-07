const AppSettings = require('../models/AppSettings');

async function getAppSettings() {
  return AppSettings.findOneAndUpdate(
    { singletonKey: 'default' },
    { $setOnInsert: { singletonKey: 'default', predictionsLocked: false } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

module.exports = {
  getAppSettings
};
