const express = require('express');
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const users = await User.find()
      .select('username totalPoints avatarPreset avatarImage')
      .sort({ totalPoints: -1, username: 1 });

    const leaderboard = users.map((user, index) => ({
      rank: index + 1,
      id: user._id,
      username: user.username,
      avatarPreset: user.avatarPreset || '',
      avatarImage: user.avatarImage || '',
      points: user.totalPoints,
      isCurrentUser: user._id.toString() === req.user._id.toString()
    }));

    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ message: 'Could not fetch leaderboard.' });
  }
});

module.exports = router;
