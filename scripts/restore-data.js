require('dotenv').config();

const mongoose = require('mongoose');
const { findLatestBackupDir, loadSnapshotFile, restoreSnapshot } = require('./data-backup');

function parseArgs(argv) {
  const options = {
    backupPath: '',
    latest: false,
    yes: false
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--latest') {
      options.latest = true;
      continue;
    }

    if (arg === '--yes') {
      options.yes = true;
      continue;
    }

    if (arg.startsWith('--backup=')) {
      options.backupPath = String(arg.slice('--backup='.length)).trim();
      continue;
    }

    if (arg === '--backup') {
      options.backupPath = String(argv[index + 1] || '').trim();
      index += 1;
      continue;
    }
  }

  return options;
}

function usage() {
  return [
    'Usage:',
    '  node scripts/restore-data.js --backup <path-to-backup-dir-or-json> --yes',
    '  node scripts/restore-data.js --latest --yes',
    '',
    'Examples:',
    '  node scripts/restore-data.js --latest --yes',
    '  node scripts/restore-data.js --backup .backups/2026-06-07T12-00-00-000Z-merge --yes'
  ].join('\n');
}

async function main() {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI is required.');
    process.exit(1);
  }

  const options = parseArgs(process.argv.slice(2));

  if (!options.yes) {
    console.error('Restoring data is destructive. Re-run with --yes to continue.');
    console.error(usage());
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);

  let backupPath = options.backupPath;
  if (!backupPath && options.latest) {
    backupPath = await findLatestBackupDir();
  }

  if (!backupPath) {
    await mongoose.disconnect();
    console.error('A backup path or --latest is required.');
    console.error(usage());
    process.exit(1);
  }

  const { filePath, snapshot } = await loadSnapshotFile(backupPath);
  const restored = await restoreSnapshot(snapshot);

  await mongoose.disconnect();

  console.log(JSON.stringify({
    restoredFrom: filePath,
    meta: snapshot.meta,
    counts: snapshot.counts,
    restored
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
