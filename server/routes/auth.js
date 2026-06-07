const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

function createToken(user) {
  return jwt.sign(
    { id: user._id, username: user.username, isAdmin: user.isAdmin },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function publicUser(user) {
  return {
    id: user._id,
    username: user.username,
    isAdmin: user.isAdmin,
    avatarPreset: user.avatarPreset || '',
    avatarImage: user.avatarImage || '',
    totalPoints: user.totalPoints
  };
}

function isValidDataImage(value) {
  if (!value) return true;
  return /^data:image\/(png|jpeg|jpg|webp|gif);base64,/i.test(String(value));
}

router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }

    const existingUser = await User.findOne({ username: username.trim() });

    if (existingUser) {
      return res.status(409).json({ message: 'Username is already taken.' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({
      username: username.trim(),
      password: hashedPassword
    });

    res.status(201).json({ token: createToken(user), user: publicUser(user) });
  } catch (error) {
    res.status(500).json({ message: 'Registration failed.' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required.' });
    }

    const user = await User.findOne({ username: username.trim() });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const passwordMatches = await bcrypt.compare(password, user.password);

    if (!passwordMatches) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    res.json({ token: createToken(user), user: publicUser(user) });
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
