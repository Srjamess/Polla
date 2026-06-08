const Entry = require('../models/Entry');
const Prediction = require('../models/Prediction');

function normalizeEntryName(value) {
  return String(value || '').trim();
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function toObjectIdString(value) {
  return value ? String(value) : '';
}

async function isEntryNameTaken(userId, name, excludeEntryId = null) {
  const existingEntry = await Entry.findOne({
    user: userId,
    name: new RegExp(`^${escapeRegex(name)}$`, 'i'),
    ...(excludeEntryId ? { _id: { $ne: excludeEntryId } } : {})
  }).select('_id');

  return Boolean(existingEntry);
}

async function buildUniqueEntryName(userId, seed) {
  const baseName = normalizeEntryName(seed).slice(0, 32) || 'Entrada';
  let candidate = baseName;
  let attempt = 1;

  while (await isEntryNameTaken(userId, candidate)) {
    const suffix = ` ${attempt}`;
    candidate = `${baseName.slice(0, Math.max(0, 32 - suffix.length))}${suffix}`;
    attempt += 1;
  }

  return candidate;
}

async function ensureUserEntries(user, requestedEntryId = null) {
  let entries = await Entry.find({ user: user._id }).sort({ createdAt: 1, _id: 1 });
  let migratedLegacyPredictions = false;

  if (!entries.length) {
    const defaultEntry = await Entry.create({
      user: user._id,
      name: await buildUniqueEntryName(user._id, user.username || 'Entrada'),
      avatarPreset: user.avatarPreset || '',
      avatarImage: user.avatarImage || '',
      predictedWorstTeam: user.predictedWorstTeam || ''
    });

    entries = [defaultEntry];
  } else if (user.predictedWorstTeam && !entries.some((entry) => String(entry.predictedWorstTeam || '').trim())) {
    const firstEntry = entries[0];
    firstEntry.predictedWorstTeam = String(user.predictedWorstTeam || '').trim();
    await firstEntry.save();
    entries = await Entry.find({ user: user._id }).sort({ createdAt: 1, _id: 1 });
  }

  const legacyPredictions = await Prediction.find({
    user: user._id,
    $or: [{ entry: { $exists: false } }, { entry: null }]
  }).select('_id');

  if (legacyPredictions.length && entries.length) {
    await Prediction.updateMany(
      { _id: { $in: legacyPredictions.map((prediction) => prediction._id) } },
      { $set: { entry: entries[0]._id } }
    );
    migratedLegacyPredictions = true;
  }

  const activeEntryId = toObjectIdString(requestedEntryId);
  const activeEntry =
    entries.find((entry) => String(entry._id) === activeEntryId) ||
    entries[0] ||
    null;

  return {
    entries,
    activeEntry,
    migratedLegacyPredictions
  };
}

function serializeEntry(entry, activeEntryId = null, owner = null) {
  if (!entry) return null;

  const ownerDoc = owner || entry.user || null;
  return {
    id: String(entry._id),
    userId: ownerDoc?._id ? String(ownerDoc._id) : String(entry.user || ''),
    name: entry.name || '',
    avatarPreset: entry.avatarPreset || '',
    avatarImage: entry.avatarImage || '',
    predictedWorstTeam: entry.predictedWorstTeam || '',
    totalPoints: Number(entry.totalPoints || 0),
    isCurrentEntry: activeEntryId ? String(entry._id) === String(activeEntryId) : false,
    ownerUsername: ownerDoc?.username || ''
  };
}

function serializeEntries(entries, activeEntryId = null) {
  return entries.map((entry) => serializeEntry(entry, activeEntryId));
}

module.exports = {
  buildUniqueEntryName,
  ensureUserEntries,
  normalizeEntryName,
  serializeEntries,
  serializeEntry
};
