const express = require('express');
const Entry = require('../models/Entry');
const Prediction = require('../models/Prediction');
const { authenticate } = require('../middleware/auth');
const { recalculateAllScores } = require('../utils/scoring');
const {
  buildUniqueEntryName,
  ensureUserEntries,
  normalizeEntryName,
  serializeEntries,
  serializeEntry
} = require('../utils/entries');

const router = express.Router();

router.use(authenticate);

async function getEntryContext(req) {
  const { entries, activeEntry, migratedLegacyPredictions } = await ensureUserEntries(
    req.user,
    req.header('x-entry-id')
  );

  return { entries, activeEntry, migratedLegacyPredictions };
}

function buildEntriesResponse(entries, activeEntry) {
  return {
    entries: serializeEntries(entries, activeEntry?._id || null),
    activeEntryId: activeEntry ? String(activeEntry._id) : '',
    activeEntry: serializeEntry(activeEntry, activeEntry?._id || null)
  };
}

router.get('/', async (req, res) => {
  try {
    const { entries, activeEntry, migratedLegacyPredictions } = await getEntryContext(req);

    if (migratedLegacyPredictions) {
      await recalculateAllScores();
    }

    res.json(buildEntriesResponse(entries, activeEntry));
  } catch (error) {
    res.status(500).json({ message: 'Could not fetch entries.' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { entries, activeEntry } = await getEntryContext(req);
    const rawName = normalizeEntryName(req.body?.name);
    const name = await buildUniqueEntryName(
      req.user._id,
      rawName || `Entrada ${entries.length + 1}`
    );

    const createdEntry = await Entry.create({
      user: req.user._id,
      name,
      avatarPreset: activeEntry?.avatarPreset || '',
      avatarImage: activeEntry?.avatarImage || '',
      predictedWorstTeam: ''
    });

    const refreshedEntries = await Entry.find({ user: req.user._id }).sort({ createdAt: 1, _id: 1 });
    res.status(201).json({
      ...buildEntriesResponse(refreshedEntries, createdEntry),
      message: 'Entrada creada.'
    });
  } catch (error) {
    res.status(500).json({ message: 'Could not create entry.' });
  }
});

router.patch('/active', async (req, res) => {
  try {
    const { entries, activeEntry } = await getEntryContext(req);
    if (!activeEntry) {
      return res.status(404).json({ message: 'Active entry not found.' });
    }

    const nextName = normalizeEntryName(req.body?.name);
    const nextAvatarPreset = typeof req.body?.avatarPreset === 'string' ? String(req.body.avatarPreset).trim() : activeEntry.avatarPreset || '';
    const nextAvatarImage = typeof req.body?.avatarImage === 'string' ? String(req.body.avatarImage).trim() : activeEntry.avatarImage || '';

    if (nextName) {
      const duplicate = entries.find(
        (entry) => String(entry._id) !== String(activeEntry._id) && String(entry.name || '').toLowerCase() === nextName.toLowerCase()
      );

      if (duplicate) {
        return res.status(409).json({ message: 'Entry name is already taken.' });
      }

      activeEntry.name = nextName;
    }

    activeEntry.avatarPreset = nextAvatarPreset;
    activeEntry.avatarImage = nextAvatarImage;
    await activeEntry.save();

    const refreshedEntries = await Entry.find({ user: req.user._id }).sort({ createdAt: 1, _id: 1 });
    res.json(buildEntriesResponse(refreshedEntries, activeEntry));
  } catch (error) {
    res.status(500).json({ message: 'Could not update active entry.' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { entries, activeEntry } = await getEntryContext(req);
    const entryId = String(req.params.id || '').trim();
    const entry = entries.find((item) => String(item._id) === entryId);

    if (!entry) {
      return res.status(404).json({ message: 'Entry not found.' });
    }

    if (entries.length <= 1) {
      return res.status(400).json({ message: 'Debes conservar al menos una entrada.' });
    }

    await Prediction.deleteMany({ entry: entry._id });
    await Entry.deleteOne({ _id: entry._id, user: req.user._id });

    const refreshedEntries = await Entry.find({ user: req.user._id }).sort({ createdAt: 1, _id: 1 });
    const nextActiveEntry =
      refreshedEntries.find((item) => String(item._id) !== String(entry._id)) ||
      refreshedEntries[0] ||
      null;

    await recalculateAllScores();

    res.json({
      ...buildEntriesResponse(refreshedEntries, nextActiveEntry),
      message: entry._id && activeEntry && String(activeEntry._id) === String(entry._id)
        ? 'Entrada eliminada y se activó otra.'
        : 'Entrada eliminada.'
    });
  } catch (error) {
    res.status(500).json({ message: 'Could not delete entry.' });
  }
});

module.exports = router;
