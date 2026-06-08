const fs = require('fs/promises');
const path = require('path');

const AppSettings = require('../server/models/AppSettings');
const Entry = require('../server/models/Entry');
const Match = require('../server/models/Match');
const Prediction = require('../server/models/Prediction');
const User = require('../server/models/User');

function toPlain(value) {
  return JSON.parse(JSON.stringify(value));
}

function buildStamp(date = new Date()) {
  return date.toISOString().replace(/[:.]/g, '-');
}

function resolveBackupDir(baseDir, label) {
  return path.join(baseDir, `${buildStamp()}-${label}`);
}

async function createBackup({
  baseDir = path.join(process.cwd(), '.backups'),
  label = 'manual'
} = {}) {
  const backupDir = resolveBackupDir(baseDir, label);
  await fs.mkdir(backupDir, { recursive: true });

  const [users, entries, predictions, matches, appSettings] = await Promise.all([
    User.find().lean(),
    Entry.find().lean(),
    Prediction.find().lean(),
    Match.find().lean(),
    AppSettings.find().lean()
  ]);

  const snapshot = {
    meta: {
      createdAt: new Date().toISOString(),
      label,
      database: process.env.MONGO_URI ? 'configured' : 'unknown'
    },
    counts: {
      users: users.length,
      entries: entries.length,
      predictions: predictions.length,
      matches: matches.length,
      appSettings: appSettings.length
    },
    collections: {
      users: toPlain(users),
      entries: toPlain(entries),
      predictions: toPlain(predictions),
      matches: toPlain(matches),
      appSettings: toPlain(appSettings)
    }
  };

  const snapshotFile = path.join(backupDir, 'snapshot.json');
  await fs.writeFile(snapshotFile, JSON.stringify(snapshot, null, 2), 'utf8');

  return {
    backupDir,
    snapshotFile,
    snapshot
  };
}

async function findLatestBackupDir(baseDir = path.join(process.cwd(), '.backups')) {
  const entries = await fs.readdir(baseDir, { withFileTypes: true }).catch(() => []);
  const directories = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()
    .reverse();

  return directories.length ? path.join(baseDir, directories[0]) : '';
}

async function loadSnapshotFile(inputPath) {
  const stats = await fs.stat(inputPath);
  const filePath = stats.isDirectory() ? path.join(inputPath, 'snapshot.json') : inputPath;
  const raw = await fs.readFile(filePath, 'utf8');
  return {
    filePath,
    snapshot: JSON.parse(raw)
  };
}

async function restoreSnapshot(snapshot) {
  const collections = snapshot?.collections || {};

  const steps = [
    { model: User, docs: collections.users || [] },
    { model: Match, docs: collections.matches || [] },
    { model: AppSettings, docs: collections.appSettings || [] },
    { model: Entry, docs: collections.entries || [] },
    { model: Prediction, docs: collections.predictions || [] }
  ];

  const results = [];

  for (const { model, docs } of steps) {
    await model.deleteMany({});
    if (docs.length) {
      await model.insertMany(docs, { ordered: true });
    }
    results.push({
      collection: model.collection.name,
      restored: docs.length
    });
  }

  return results;
}

module.exports = {
  createBackup,
  findLatestBackupDir,
  loadSnapshotFile,
  restoreSnapshot
};
