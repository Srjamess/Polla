require('dotenv').config();

const mongoose = require('mongoose');
const Entry = require('../server/models/Entry');
const Prediction = require('../server/models/Prediction');
const User = require('../server/models/User');
const { recalculateAllScores } = require('../server/utils/scoring');
const { buildUniqueEntryName, normalizeEntryName } = require('../server/utils/entries');
const { createBackup } = require('./data-backup');

function parseArgs(argv) {
  const options = {
    target: '',
    sources: [],
    dryRun: false,
    deleteSources: false,
    skipBackup: false,
    backupLabel: 'merge'
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--dry-run') {
      options.dryRun = true;
      continue;
    }

    if (arg === '--delete-sources') {
      options.deleteSources = true;
      continue;
    }

    if (arg === '--skip-backup') {
      options.skipBackup = true;
      continue;
    }

    if (arg.startsWith('--backup-label=')) {
      options.backupLabel = String(arg.slice('--backup-label='.length)).trim() || 'merge';
      continue;
    }

    if (arg === '--backup-label') {
      options.backupLabel = String(argv[index + 1] || '').trim() || 'merge';
      index += 1;
      continue;
    }

    if (arg.startsWith('--target=')) {
      options.target = arg.slice('--target='.length).trim();
      continue;
    }

    if (arg === '--target') {
      options.target = String(argv[index + 1] || '').trim();
      index += 1;
      continue;
    }

    if (arg.startsWith('--source=')) {
      const value = arg.slice('--source='.length);
      options.sources.push(...value.split(',').map((item) => item.trim()).filter(Boolean));
      continue;
    }

    if (arg === '--source') {
      const value = String(argv[index + 1] || '').trim();
      if (value) options.sources.push(value);
      index += 1;
    }
  }

  options.sources = [...new Set(options.sources.map((item) => item.trim()).filter(Boolean))];
  return options;
}

function usage() {
  return [
    'Usage:',
    '  node scripts/merge-accounts.js --target <userId|username|email> --source <id|username|email> [--source <...>] [--dry-run] [--delete-sources]',
    '',
    'Examples:',
    '  node scripts/merge-accounts.js --target juan@mail.com --source juan.1@mail.com --source juan.2@mail.com --dry-run',
    '  node scripts/merge-accounts.js --target juan@mail.com --source juan.1@mail.com --source juan.2@mail.com --delete-sources'
  ].join('\n');
}

async function resolveUser(identifier) {
  const value = String(identifier || '').trim();
  if (!value) return null;

  let user = null;

  if (mongoose.Types.ObjectId.isValid(value)) {
    user = await User.findById(value);
  }

  if (!user) {
    user = await User.findOne({ username: value });
  }

  if (!user) {
    user = await User.findOne({ email: value.toLowerCase() });
  }

  return user;
}

function buildLegacyEntrySeed(sourceUser) {
  return normalizeEntryName(
    sourceUser.username ||
    sourceUser.email ||
    sourceUser.firebaseUid ||
    'Entrada'
  ).slice(0, 32) || 'Entrada';
}

async function cloneSourceEntries(sourceUser, targetUser, dryRun) {
  const sourceEntries = await Entry.find({ user: sourceUser._id }).sort({ createdAt: 1, _id: 1 });
  const sourcePredictions = await Prediction.find({ user: sourceUser._id }).select('_id entry');

  const entryMap = new Map();
  const plan = [];

  const entryCopies = sourceEntries.length ? sourceEntries : [null];
  for (const sourceEntry of entryCopies) {
    const seedName = sourceEntry?.name || buildLegacyEntrySeed(sourceUser);
    const plannedName = sourceEntry
      ? seedName
      : await buildUniqueEntryName(targetUser._id, seedName);

    if (dryRun) {
      const fakeId = new mongoose.Types.ObjectId();
      entryMap.set(String(sourceEntry?._id || 'legacy'), fakeId);
      plan.push({
        sourceEntryId: sourceEntry ? String(sourceEntry._id) : 'legacy',
        sourceEntryName: sourceEntry?.name || '(legacy)',
        targetEntryName: plannedName,
        targetEntryId: String(fakeId)
      });
      continue;
    }

    const createdEntry = await Entry.create({
      user: targetUser._id,
      name: await buildUniqueEntryName(targetUser._id, seedName),
      avatarPreset: sourceEntry?.avatarPreset || sourceUser.avatarPreset || '',
      avatarImage: sourceEntry?.avatarImage || sourceUser.avatarImage || '',
      predictedWorstTeam: sourceEntry?.predictedWorstTeam || sourceUser.predictedWorstTeam || ''
    });

    entryMap.set(String(sourceEntry?._id || 'legacy'), createdEntry._id);
    plan.push({
      sourceEntryId: sourceEntry ? String(sourceEntry._id) : 'legacy',
      sourceEntryName: sourceEntry?.name || '(legacy)',
      targetEntryName: createdEntry.name,
      targetEntryId: String(createdEntry._id)
    });
  }

  let transferredPredictions = 0;
  const legacyTargetEntryId = entryMap.get(String(sourceEntries[0]?._id || 'legacy')) || null;

  for (const prediction of sourcePredictions) {
    const sourceEntryKey = prediction.entry ? String(prediction.entry) : 'legacy';
    const targetEntryId = entryMap.get(sourceEntryKey) || legacyTargetEntryId;
    if (!targetEntryId) continue;

    transferredPredictions += 1;

    if (dryRun) {
      continue;
    }

    await Prediction.updateOne(
      { _id: prediction._id },
      {
        $set: {
          user: targetUser._id,
          entry: targetEntryId
        }
      }
    );
  }

  return {
    sourceEntries,
    sourcePredictions,
    transferredPredictions,
    plan
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI is required.');
    process.exit(1);
  }

  if (!options.target || !options.sources.length) {
    console.error(usage());
    process.exit(1);
  }

  if (!options.dryRun && !options.deleteSources) {
    console.error('A real merge requires --delete-sources so legacy accounts do not recreate empty entries later.');
    console.error(usage());
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);

  const targetUser = await resolveUser(options.target);
  if (!targetUser) {
    throw new Error(`Target user not found: ${options.target}`);
  }

  const sourceUsers = [];
  for (const identifier of options.sources) {
    const user = await resolveUser(identifier);
    if (!user) {
      throw new Error(`Source user not found: ${identifier}`);
    }
    if (String(user._id) === String(targetUser._id)) {
      continue;
    }
    sourceUsers.push(user);
  }

  const uniqueSourceUsers = sourceUsers.filter(
    (user, index, list) => index === list.findIndex((candidate) => String(candidate._id) === String(user._id))
  );

  if (!uniqueSourceUsers.length) {
    throw new Error('No source users left to merge after filtering duplicates.');
  }

  let backupInfo = null;
  if (!options.dryRun && !options.skipBackup) {
    backupInfo = await createBackup({ label: options.backupLabel });
  }

  const summary = {
    targetUser: {
      id: String(targetUser._id),
      username: targetUser.username,
      email: targetUser.email || ''
    },
    deleteSources: Boolean(options.deleteSources),
    dryRun: Boolean(options.dryRun),
    backup: backupInfo ? {
      dir: backupInfo.backupDir,
      file: backupInfo.snapshotFile
    } : null,
    sources: []
  };

  const sourceEntryIdsToDelete = [];
  const sourceUserIdsToDelete = [];

  for (const sourceUser of uniqueSourceUsers) {
    const mergeResult = await cloneSourceEntries(sourceUser, targetUser, options.dryRun);
    summary.sources.push({
      id: String(sourceUser._id),
      username: sourceUser.username,
      email: sourceUser.email || '',
      entries: mergeResult.plan,
      predictions: mergeResult.transferredPredictions
    });

    if (!options.dryRun) {
      sourceEntryIdsToDelete.push(...mergeResult.sourceEntries.map((entry) => entry._id));
      sourceUserIdsToDelete.push(sourceUser._id);
    }
  }

  if (options.dryRun) {
    await mongoose.disconnect();
    console.log(JSON.stringify(summary, null, 2));
    return;
  }

  if (options.deleteSources) {
    if (sourceEntryIdsToDelete.length) {
      await Entry.deleteMany({ _id: { $in: sourceEntryIdsToDelete } });
    }

    if (sourceUserIdsToDelete.length) {
      await User.deleteMany({ _id: { $in: sourceUserIdsToDelete } });
    }
  }

  await recalculateAllScores();
  await mongoose.disconnect();

  console.log(JSON.stringify(summary, null, 2));
  console.log(
    options.deleteSources
      ? 'Merge completed and source accounts were deleted.'
      : 'Merge completed. Source accounts were kept. Delete them later to avoid empty legacy accounts.'
  );
  if (backupInfo) {
    console.log(`Backup saved at: ${backupInfo.snapshotFile}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
