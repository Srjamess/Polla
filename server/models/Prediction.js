const mongoose = require('mongoose');

const predictionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    match: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Match',
      required: true
    },
    predictedScoreA: {
      type: Number,
      required: true,
      min: 0
    },
    predictedScoreB: {
      type: Number,
      required: true,
      min: 0
    },
    predictedQualifiedTeam: {
      type: String,
      enum: ['', 'teamA', 'teamB'],
      default: ''
    },
    points: {
      type: Number,
      default: 0
    },
    scored: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

predictionSchema.index({ user: 1, match: 1 }, { unique: true });

module.exports = mongoose.model('Prediction', predictionSchema);
