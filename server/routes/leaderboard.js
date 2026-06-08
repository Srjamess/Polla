const express = require('express');
const Entry = require('../models/Entry');
const { authenticate } = require('../middleware/auth');
const { ensureUserEntries } = require('../utils/entries');

const router = express.Router();

router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const { activeEntry } = await ensureUserEntries(req.user, req.header('x-entry-id'));

    const leaderboardEntries = await Entry.find()
      .populate('user', 'username isPaid')
      .select('user name avatarPreset avatarImage totalPoints createdAt')
      .sort({ totalPoints: -1, name: 1, createdAt: 1 });

    const leaderboard = leaderboardEntries.map((entry, index) => ({
      rank: index + 1,
      id: entry._id,
      userId: entry.user?._id || null,
      username: entry.name || '',
      ownerUsername: entry.user?.username || '',
      avatarPreset: entry.avatarPreset || '',
      avatarImage: entry.avatarImage || '',
      isPaid: Boolean(entry.user?.isPaid),
      points: Number(entry.totalPoints || 0),
      isCurrentUser: activeEntry ? String(entry._id) === String(activeEntry._id) : false
    }));

    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ message: 'Could not fetch leaderboard.' });
  }
});

module.exports = router;
