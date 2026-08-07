const express = require('express');
const { authenticateJWT } = require('../middleware/auth');
const UserStore = require('../models/User');
const { getVapidKeys } = require('../config/vapid');

const router = express.Router();

// GET /api/push/vapid-public-key
router.get('/vapid-public-key', (req, res) => {
  const keys = getVapidKeys();
  res.json({ publicKey: keys.publicKey });
});

// POST /api/push/subscribe
router.post('/subscribe', authenticateJWT, async (req, res) => {
  try {
    const { subscription } = req.body;
    if (!subscription) {
      return res.status(400).json({ error: 'Subscription object required' });
    }

    const user = await UserStore.findByUsername(req.user.username);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await UserStore.updatePushSub(user._id, subscription);
    res.json({ message: 'Push notification subscription saved successfully' });
  } catch (error) {
    console.error('[Push Subscribe Error]', error);
    res.status(500).json({ error: 'Failed to save push subscription' });
  }
});

module.exports = router;
