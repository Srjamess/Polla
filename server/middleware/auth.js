const User = require('../models/User');
const { getFirebaseAuth } = require('../utils/firebaseAdmin');

async function verifyFirebaseToken(token) {
  return getFirebaseAuth().verifyIdToken(token);
}

async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      return res.status(401).json({ message: 'Missing authorization token.' });
    }

    const decoded = await verifyFirebaseToken(token);
    const user = await User.findOne({ firebaseUid: decoded.uid }).select('-password');

    if (!user) {
      return res.status(401).json({ message: 'Invalid authorization token.' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid authorization token.' });
  }
}

function requireAdmin(req, res, next) {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ message: 'Admin access required.' });
  }

  next();
}

module.exports = { authenticate, requireAdmin, verifyFirebaseToken };
