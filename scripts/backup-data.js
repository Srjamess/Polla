require('dotenv').config();

const mongoose = require('mongoose');
const { createBackup } = require('./data-backup');

function parseArgs(argv) {
  const options = {
    label: 'manual'
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg.startsWith('--label=')) {
      options.label = String(arg.slice('--label='.length)).trim() || 'manual';
      continue;
    }

    if (arg === '--label') {
      options.label = String(argv[index + 1] || '').trim() || 'manual';
      index += 1;
      continue;
    }

    if (!arg.startsWith('--') && options.label === 'manual') {
      options.label = String(arg || '').trim() || 'manual';
    }
  }

  return options;
}

async function main() {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI is required.');
    process.exit(1);
  }

  const options = parseArgs(process.argv.slice(2));

  await mongoose.connect(process.env.MONGO_URI);

  const backup = await createBackup({ label: options.label });

  await mongoose.disconnect();

  console.log(JSON.stringify({
    backupDir: backup.backupDir,
    snapshotFile: backup.snapshotFile,
    counts: backup.snapshot.counts
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
