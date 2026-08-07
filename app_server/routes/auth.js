const express = require('express');
const bcrypt = require('bcryptjs');
const UserStore = require('../models/User');
const { generateToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/check-fingerprint/:fingerprint -> Auto-login matching hardware signature!
router.get('/check-fingerprint/:fingerprint', async (req, res) => {
  try {
    const { fingerprint } = req.params;
    if (!fingerprint) return res.json({ found: false });

    const user = await UserStore.findByFingerprint(fingerprint);
    if (user) {
      const token = generateToken({ id: user._id, username: user.username, uuid: user.uuid });
      return res.json({
        found: true,
        username: user.username,
        uuid: user.uuid,
        token
      });
    }
    res.json({ found: false });
  } catch (error) {
    res.json({ found: false });
  }
});

// GET /api/check-uuid/:uuid
router.get('/check-uuid/:uuid', async (req, res) => {
  try {
    const user = await UserStore.findByUUID(req.params.uuid);
    if (user) {
      const token = generateToken({ id: user._id, username: user.username, uuid: user.uuid });
      return res.json({ found: true, username: user.username, uuid: user.uuid, token });
    }
    res.json({ found: false });
  } catch (error) {
    res.json({ found: false });
  }
});

// POST /api/register
router.post('/register', async (req, res) => {
  try {
    const { username, pin, uuid, fingerprint } = req.body;

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
      fingerprint: fingerprint || '',
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
router.post('/login', async (req, res) => {
  try {
    const { username, pin, uuid, fingerprint } = req.body;

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

    // Link UUID & Hardware Fingerprint to user
    if (uuid && user.uuid !== uuid) {
      await UserStore.updateUUID(user._id, uuid);
    }
    if (fingerprint) {
      await UserStore.updateFingerprint(user._id, fingerprint);
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
router.post('/reset-pin', async (req, res) => {
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
