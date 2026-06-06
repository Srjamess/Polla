const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      trim: true,
      uppercase: true,
      unique: true,
      sparse: true
    },
    teamA: {
      type: String,
      required: true,
      trim: true
    },
    teamB: {
      type: String,
      required: true,
      trim: true
    },
    matchDate: {
      type: Date,
      required: true
    },
    stage: {
      type: String,
      enum: ['group', 'roundOf32', 'roundOf16', 'quarterfinal', 'semifinal', 'thirdPlace', 'final'],
      required: true
    },
    group: {
      type: String,
      trim: true,
      uppercase: true,
      maxlength: 2,
      default: ''
    },
    sourceA: {
      type: String,
      trim: true,
      default: ''
    },
    sourceB: {
      type: String,
      trim: true,
      default: ''
    },
    venue: {
      type: String,
      trim: true,
      default: ''
    },
    scoreA: {
      type: Number,
      min: 0,
      default: null
    },
    scoreB: {
      type: Number,
      min: 0,
      default: null
    },
    resultSet: {
      type: Boolean,
      default: false
    },
    qualifiedTeam: {
      type: String,
      enum: ['', 'teamA', 'teamB'],
      default: ''
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Match', matchSchema);
