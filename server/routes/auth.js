const express = require('express');
const User = require('../models/User');
const { authenticate, verifyFirebaseToken } = require('../middleware/auth');

const router = express.Router();

function getFirebaseClientConfig() {
  return {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '',
    appId: process.env.FIREBASE_APP_ID,
    measurementId: process.env.FIREBASE_MEASUREMENT_ID || ''
  };
}

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizeUsername(value) {
  return String(value || '').trim();
}

function sanitizeUsernameSeed(value) {
  return String(value || '')
    .replace(/[^\p{L}\p{N}\s._-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function isUsernameTaken(username, excludeUserId = null) {
  const existingUser = await User.findOne({
    username: new RegExp(`^${escapeRegex(username)}$`, 'i')
  }).select('_id');

  if (!existingUser) return false;
  if (!excludeUserId) return true;

  return String(existingUser._id) !== String(excludeUserId);
}

async function buildUniqueUsername(seed) {
  const baseUsername = sanitizeUsernameSeed(seed).slice(0, 32) || 'Usuario';
  let candidate = baseUsername;
  let attempt = 1;

  while (await isUsernameTaken(candidate)) {
    const suffix = ` ${attempt}`;
    candidate = `${baseUsername.slice(0, Math.max(0, 32 - suffix.length))}${suffix}`;
    attempt += 1;
  }

  return candidate;
}

async function findUserByFirebaseIdentity(decodedToken) {
  const normalizedEmail = normalizeEmail(decodedToken.email);
  let user = await User.findOne({ firebaseUid: decodedToken.uid });

  if (!user && normalizedEmail) {
    user = await User.findOne({ email: normalizedEmail });
  }

  if (user && (!user.firebaseUid || (normalizedEmail && user.email !== normalizedEmail))) {
    user.firebaseUid = decodedToken.uid;
    if (normalizedEmail) user.email = normalizedEmail;
    await user.save();
  }

  return user;
}

async function verifyTokenFromBody(req, res) {
  const idToken = String(req.body?.idToken || '').trim();

  if (!idToken) {
    res.status(400).json({ message: 'Firebase ID token is required.' });
    return null;
  }

  try {
    return await verifyFirebaseToken(idToken);
  } catch (error) {
    res.status(401).json({ message: 'Firebase session is invalid.' });
    return null;
  }
}

function publicUser(user) {
  return {
    id: user._id,
    username: user.username,
    email: user.email || '',
    isAdmin: user.isAdmin,
    avatarPreset: user.avatarPreset || '',
    avatarImage: user.avatarImage || '',
    predictedWorstTeam: user.predictedWorstTeam || '',
    totalPoints: user.totalPoints
  };
}

function isValidDataImage(value) {
  if (!value) return true;
  return /^data:image\/(png|jpeg|jpg|webp|gif);base64,/i.test(String(value));
}

router.get('/config', (req, res) => {
  res.json({
    enabled: true,
    firebaseConfig: getFirebaseClientConfig()
  });
});

router.post('/register', async (req, res) => {
  try {
    const decodedToken = await verifyTokenFromBody(req, res);
    if (!decodedToken) return;

    const username = normalizeUsername(req.body?.username);
    const email = normalizeEmail(decodedToken.email);

    if (!email) {
      return res.status(400).json({ message: 'Firebase must return a valid email address.' });
    }

    if (username.length < 3 || username.length > 32) {
      return res.status(400).json({ message: 'Username must be between 3 and 32 characters.' });
    }

    const existingIdentity = await findUserByFirebaseIdentity(decodedToken);

    if (await isUsernameTaken(username, existingIdentity?._id)) {
      return res.status(409).json({ message: 'Username is already taken.' });
    }

    if (existingIdentity) {
      existingIdentity.username = username;
      existingIdentity.email = email;
      existingIdentity.firebaseUid = decodedToken.uid;
      await existingIdentity.save();

      return res.status(200).json({ token: req.body.idToken, user: publicUser(existingIdentity) });
    }

    const user = await User.create({
      username,
      email,
      firebaseUid: decodedToken.uid
    });

    res.status(201).json({ token: req.body.idToken, user: publicUser(user) });
  } catch (error) {
    res.status(500).json({ message: 'Registration failed.' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const decodedToken = await verifyTokenFromBody(req, res);
    if (!decodedToken) return;

    let user = await findUserByFirebaseIdentity(decodedToken);

    if (!user) {
      const email = normalizeEmail(decodedToken.email);
      const seed =
        sanitizeUsernameSeed(decodedToken.name) ||
        sanitizeUsernameSeed(email.split('@')[0]) ||
        'Usuario';

      user = await User.create({
        username: await buildUniqueUsername(seed),
        email,
        firebaseUid: decodedToken.uid
      });
    }

    res.json({ token: req.body.idToken, user: publicUser(user) });
  } catch (error) {
    res.status(500).json({ message: 'Login failed.' });
  }
});

router.get('/me', authenticate, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

router.patch('/me', authenticate, async (req, res) => {
  try {
    const { avatarPreset, avatarImage } = req.body;

    if (avatarPreset != null && typeof avatarPreset !== 'string') {
      return res.status(400).json({ message: 'Invalid avatar preset.' });
    }

    if (avatarImage != null && typeof avatarImage !== 'string') {
      return res.status(400).json({ message: 'Invalid avatar image.' });
    }

    const nextPreset = String(avatarPreset || '').trim();
    const nextImage = String(avatarImage || '').trim();

    if (!isValidDataImage(nextImage)) {
      return res.status(400).json({ message: 'Avatar image must be a valid image file.' });
    }

    if (nextImage.length > 1_500_000) {
      return res.status(400).json({ message: 'Avatar image is too large.' });
    }

    req.user.avatarPreset = nextPreset;
    req.user.avatarImage = nextImage;
    await req.user.save();

    res.json({ user: publicUser(req.user) });
  } catch (error) {
    res.status(500).json({ message: 'Could not update profile.' });
  }
});

module.exports = router;
