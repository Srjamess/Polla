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
    totalPoints: user.totalPoints
  };
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

module.exports = router;
