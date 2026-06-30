require('dotenv').config();

const path = require('path');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const entryRoutes = require('./routes/entries');
const matchRoutes = require('./routes/matches');
const predictionRoutes = require('./routes/predictions');
const leaderboardRoutes = require('./routes/leaderboard');
const Match = require('./models/Match');
const { syncLiveScores, shouldPollLiveFeed } = require('./utils/liveSync');

const app = express();
const PORT = process.env.PORT || 3000;

if (!process.env.MONGO_URI) {
  console.error('MONGO_URI is required.');
  process.exit(1);
}

const requiredFirebaseClientEnv = [
  'FIREBASE_API_KEY',
  'FIREBASE_AUTH_DOMAIN',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_APP_ID'
];

const missingFirebaseClientEnv = requiredFirebaseClientEnv.filter((key) => !process.env[key]);

if (missingFirebaseClientEnv.length) {
  console.error(`Missing Firebase client variables: ${missingFirebaseClientEnv.join(', ')}`);
  process.exit(1);
}

if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  const requiredFirebaseAdminEnv = [
    'FIREBASE_PROJECT_ID',
    'FIREBASE_CLIENT_EMAIL',
    'FIREBASE_PRIVATE_KEY'
  ];
  const missingFirebaseAdminEnv = requiredFirebaseAdminEnv.filter((key) => !process.env[key]);

  if (missingFirebaseAdminEnv.length) {
    console.error(`Missing Firebase admin variables: ${missingFirebaseAdminEnv.join(', ')}`);
    process.exit(1);
  }
}

if (!process.env.FIREBASE_AUTH_DOMAIN) {
  console.error('FIREBASE_AUTH_DOMAIN is required.');
  process.exit(1);
}

app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/entries', entryRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/predictions', predictionRoutes);
app.use('/api/leaderboard', leaderboardRoutes);

app.use(express.static(path.join(__dirname, '..', 'client')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'client', 'index.html'));
});

async function runLiveSyncIfNeeded() {
  try {
    const matches = await Match.find({}, { matchDate: 1, liveStatus: 1, resultSet: 1, liveUpdatedAt: 1, updatedAt: 1, createdAt: 1 }).lean();
    if (!shouldPollLiveFeed(matches)) {
      return;
    }

    await syncLiveScores({ silent: true });
  } catch (error) {
    console.warn(`Live sync skipped: ${error.message}`);
  }
}

async function syncIndexesInBackground() {
  try {
    await Promise.all([
      mongoose.model('Prediction').syncIndexes(),
      mongoose.model('Entry').syncIndexes()
    ]);
  } catch (error) {
    console.warn(`Index sync skipped: ${error.message}`);
  }
}

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Polla Mundialista running on http://localhost:${PORT}`);
    });
    void syncIndexesInBackground();
    void runLiveSyncIfNeeded();
    setInterval(() => {
      void runLiveSyncIfNeeded();
    }, 15 * 1000);
  })
  .catch((error) => {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  });
