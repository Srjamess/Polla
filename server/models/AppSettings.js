const mongoose = require('mongoose');

const appSettingsSchema = new mongoose.Schema(
  {
    singletonKey: {
      type: String,
      required: true,
      unique: true,
      default: 'default'
    },
    predictionsLocked: {
      type: Boolean,
      default: false
    },
    actualWorstTeam: {
      type: String,
      default: ''
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('AppSettings', appSettingsSchema);
