const express = require('express');
const Match = require('../models/Match');
const Prediction = require('../models/Prediction');
const User = require('../models/User');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { recalculateAllScores } = require('../utils/scoring');
const { getAppSettings } = require('../utils/appSettings');

const router = express.Router();

router.use(authenticate);
router.use(requireAdmin);

router.get('/settings', async (req, res) => {
  try {
    const settings = await getAppSettings();
    res.json({
      predictionsLocked: Boolean(settings.predictionsLocked),
      updatedAt: settings.updatedAt
    });
  } catch (error) {
    res.status(500).json({ message: 'No se pudo cargar la configuracion de admin.' });
  }
});

router.post('/predictions-lock', async (req, res) => {
  try {
    if (typeof req.body?.locked !== 'boolean') {
      return res.status(400).json({ message: 'El estado de bloqueo es obligatorio.' });
    }

    const settings = await getAppSettings();
    settings.predictionsLocked = req.body.locked;
    await settings.save();

    res.json({
      message: settings.predictionsLocked ? 'Predicciones bloqueadas.' : 'Predicciones reabiertas.',
      predictionsLocked: Boolean(settings.predictionsLocked),
      updatedAt: settings.updatedAt
    });
  } catch (error) {
    res.status(500).json({ message: 'No se pudo actualizar el bloqueo de predicciones.' });
  }
});

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
