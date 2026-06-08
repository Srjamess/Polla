const mongoose = require('mongoose');

const entrySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 32
    },
    avatarPreset: {
      type: String,
      default: ''
    },
    avatarImage: {
      type: String,
      default: ''
    },
    predictedWorstTeam: {
      type: String,
      default: ''
    },
    isPaid: {
      type: Boolean,
      default: false
    },
    totalPoints: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

entrySchema.index({ user: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Entry', entrySchema);
