const express = require('express');
const Match = require('../models/Match');
const Prediction = require('../models/Prediction');
const User = require('../models/User');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { recalculateAllScores } = require('../utils/scoring');

const router = express.Router();

router.use(authenticate);
router.use(requireAdmin);

router.post('/reset-pruebas', async (req, res) => {
  try {
    const matchUpdate = await Match.updateMany(
      {},
      {
        $set: {
          scoreA: null,
          scoreB: null,
          resultSet: false,
          qualifiedTeam: ''
        }
      }
    );

    const predictionDelete = await Prediction.deleteMany({});
    const userUpdate = await User.updateMany({}, { $set: { totalPoints: 0 } });

    await recalculateAllScores();

    res.json({
      message: 'Pruebas reiniciadas.',
      matchesUpdated: matchUpdate.modifiedCount,
      predictionsDeleted: predictionDelete.deletedCount,
      usersReset: userUpdate.modifiedCount
    });
  } catch (error) {
    res.status(500).json({ message: 'No se pudo reiniciar la informacion de pruebas.' });
  }
});

module.exports = router;
