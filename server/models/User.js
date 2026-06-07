const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 32
    },
    email: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      lowercase: true
    },
    firebaseUid: {
      type: String,
      unique: true,
      sparse: true,
      trim: true
    },
    password: {
      type: String,
      default: null
    },
    isAdmin: {
      type: Boolean,
      default: false
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
    totalPoints: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
