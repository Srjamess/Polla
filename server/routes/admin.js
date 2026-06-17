const express = require('express');
const Match = require('../models/Match');
const Entry = require('../models/Entry');
const Prediction = require('../models/Prediction');
const User = require('../models/User');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { recalculateAllScores } = require('../utils/scoring');
const { getAppSettings } = require('../utils/appSettings');

const router = express.Router();

router.use(authenticate);
router.use(requireAdmin);

function getUniqueTeams(matches) {
  return [...new Set(
    matches
      .flatMap((match) => [match.teamA, match.teamB])
      .map((team) => String(team || '').trim())
      .filter(Boolean)
  )].sort((a, b) => a.localeCompare(b, 'es'));
}

router.get('/settings', async (req, res) => {
  try {
    const settings = await getAppSettings();
    const matches = await Match.find().select('teamA teamB');
    res.json({
      predictionsLocked: Boolean(settings.predictionsLocked),
      actualWorstTeam: settings.actualWorstTeam || '',
      teams: getUniqueTeams(matches),
      updatedAt: settings.updatedAt
    });
  } catch (error) {
    res.status(500).json({ message: 'No se pudo cargar la configuracion de admin.' });
  }
});

router.get('/users', async (req, res) => {
  try {
    const entries = await Entry.find()
      .populate('user', 'username email')
      .select('user name isPaid totalPoints createdAt')
      .sort({ createdAt: 1, name: 1 });

    res.json({
      entries: entries.map((entry) => ({
        id: entry._id,
        userId: entry.user?._id || null,
        username: entry.name,
        ownerUsername: entry.user?.username || '',
        email: entry.user?.email || '',
        isPaid: Boolean(entry.isPaid),
        totalPoints: Number(entry.totalPoints || 0),
        createdAt: entry.createdAt
      }))
    });
  } catch (error) {
    res.status(500).json({ message: 'No se pudo cargar la lista de entradas.' });
  }
});

router.patch('/users/:id/payment', async (req, res) => {
  try {
    if (typeof req.body?.isPaid !== 'boolean') {
      return res.status(400).json({ message: 'El estado de pago es obligatorio.' });
    }

    const entry = await Entry.findById(req.params.id).populate('user', 'username email');
    if (!entry) {
      return res.status(404).json({ message: 'Entrada no encontrada.' });
    }

    entry.isPaid = req.body.isPaid;
    await entry.save();

    res.json({
      message: entry.isPaid ? 'Entrada marcada como pagada.' : 'Entrada marcada como pendiente.',
      entry: {
        id: entry._id,
        username: entry.name,
        ownerUsername: entry.user?.username || '',
        isPaid: Boolean(entry.isPaid)
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'No se pudo actualizar el estado de pago.' });
  }
});

router.post('/worst-team', async (req, res) => {
  try {
    const matches = await Match.find().select('teamA teamB');
    const teams = getUniqueTeams(matches);
    const actualWorstTeam = String(req.body?.actualWorstTeam || '').trim();

    if (actualWorstTeam && !teams.includes(actualWorstTeam)) {
      return res.status(400).json({ message: 'Selecciona un equipo valido.' });
    }

    const settings = await getAppSettings();
    settings.actualWorstTeam = actualWorstTeam;
    await settings.save();
    await recalculateAllScores();

    res.json({
      message: actualWorstTeam ? 'Peor equipo oficial actualizado.' : 'Peor equipo oficial limpiado.',
      actualWorstTeam: settings.actualWorstTeam || '',
      predictionsLocked: Boolean(settings.predictionsLocked),
      teams,
      updatedAt: settings.updatedAt
    });
  } catch (error) {
    res.status(500).json({ message: 'No se pudo actualizar el peor equipo oficial.' });
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
          liveScoreA: null,
          liveScoreB: null,
          liveMinute: '',
          liveStatus: '',
          liveQualifiedTeam: '',
          liveUpdatedAt: null,
          resultSet: false,
          qualifiedTeam: '',
          resultSource: ''
        }
      }
    );

    const predictionDelete = await Prediction.deleteMany({});
    const entryUpdate = await Entry.updateMany({}, { $set: { totalPoints: 0, predictedWorstTeam: '', isPaid: false } });
    const userUpdate = await User.updateMany({}, { $set: { totalPoints: 0, predictedWorstTeam: '', isPaid: false } });
    const settings = await getAppSettings();
    settings.actualWorstTeam = '';
    await settings.save();

    await recalculateAllScores();

    res.json({
      message: 'Pruebas reiniciadas.',
      matchesUpdated: matchUpdate.modifiedCount,
      predictionsDeleted: predictionDelete.deletedCount,
      entriesReset: entryUpdate.modifiedCount,
      usersReset: userUpdate.modifiedCount
    });
  } catch (error) {
    res.status(500).json({ message: 'No se pudo reiniciar la informacion de pruebas.' });
  }
});

module.exports = router;
