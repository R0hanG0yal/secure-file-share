const express = require('express');
const bcrypt = require('bcryptjs');
const UserStore = require('../models/User');
const { generateToken, authenticateJWT } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// GET /api/me -> Verify JWT token & restore user profile (solves username missing after deploy)
router.get('/me', authenticateJWT, async (req, res) => {
  try {
    const user = await UserStore.findByUsername(req.user.username);
    if (!user) {
      return res.status(404).json({ error: 'User profile not found.' });
    }
    res.json({
      authenticated: true,
      username: user.username,
      uuid: user.uuid || req.user.uuid
    });
  } catch (error) {
    console.error('[Profile Error]', error);
    res.status(500).json({ error: 'Failed to retrieve profile.' });
  }
});

// POST /api/register
router.post('/register', authLimiter, async (req, res) => {
  try {
    const { username, pin, uuid } = req.body;

    if (!username || typeof username !== 'string' || username.trim().length < 3 || username.trim().length > 20) {
      return res.status(400).json({ error: 'Username must be between 3 and 20 characters.' });
    }

    if (!pin || !/^\d{6}$/.test(pin.toString())) {
      return res.status(400).json({ error: 'Passcode must be exactly 6 digits.' });
    }

    if (!uuid) {
      return res.status(400).json({ error: 'Device token is required.' });
    }

    const cleanUsername = username.trim();

    const existing = await UserStore.findByUsername(cleanUsername);
    if (existing) {
      return res.status(400).json({ error: `Username "${cleanUsername}" is already taken. Please choose another.` });
    }

    const salt = await bcrypt.genSalt(10);
    const pinHash = await bcrypt.hash(pin.toString(), salt);

    const newUser = await UserStore.create({
      username: cleanUsername,
      pinHash,
      uuid,
      fingerprint: '',
      pushSub: null
    });

    const token = generateToken({ id: newUser._id, username: cleanUsername, uuid });

    res.status(201).json({
      message: 'Registration successful',
      token,
      username: cleanUsername,
      uuid
    });
  } catch (error) {
    console.error('[Register Error]', error);
    res.status(500).json({ error: 'Registration failed server error' });
  }
});

// POST /api/login
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { username, pin, uuid } = req.body;

    if (!username || !pin) {
      return res.status(400).json({ error: 'Username and 6-digit passcode are required.' });
    }

    const cleanUsername = username.trim();
    const user = await UserStore.findByUsername(cleanUsername);

    if (!user) {
      return res.status(401).json({ error: 'Invalid username or passcode.' });
    }

    const isMatch = await bcrypt.compare(pin.toString(), user.pinHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid username or passcode.' });
    }

    // Link device UUID to user
    if (uuid && user.uuid !== uuid) {
      await UserStore.updateUUID(user._id, uuid);
    }

    const effectiveUUID = uuid || user.uuid;
    const token = generateToken({ id: user._id, username: user.username, uuid: effectiveUUID });

    res.json({
      message: 'Login successful',
      token,
      username: user.username,
      uuid: effectiveUUID
    });
  } catch (error) {
    console.error('[Login Error]', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// POST /api/reset-pin
router.post('/reset-pin', authLimiter, async (req, res) => {
  try {
    const { username, newPin, uuid } = req.body;

    if (!username || !newPin || !uuid) {
      return res.status(400).json({ error: 'Username, new 6-digit passcode, and device token are required.' });
    }

    if (!/^\d{6}$/.test(newPin.toString())) {
      return res.status(400).json({ error: 'New passcode must be exactly 6 digits.' });
    }

    const cleanUsername = username.trim();
    const user = await UserStore.findByUsername(cleanUsername);

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (user.uuid !== uuid) {
      return res.status(403).json({ error: 'Device verification failed. Reset is only allowed from your registered device.' });
    }

    const salt = await bcrypt.genSalt(10);
    const pinHash = await bcrypt.hash(newPin.toString(), salt);

    await UserStore.updatePin(user._id, pinHash);

    const token = generateToken({ id: user._id, username: user.username, uuid });

    res.json({
      message: 'Passcode successfully reset!',
      token,
      username: user.username
    });
  } catch (error) {
    console.error('[Reset PIN Error]', error);
    res.status(500).json({ error: 'Failed to reset passcode' });
  }
});

module.exports = router;
