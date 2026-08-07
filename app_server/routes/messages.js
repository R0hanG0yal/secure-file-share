const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const webpush = require('web-push');

const { authenticateJWT } = require('../middleware/auth');
const MessageStore = require('../models/Message');
const UserStore = require('../models/User');
const { uploadFile } = require('../config/cloudinary');

const router = express.Router();

// Multer setup with temporary directory & virtually unlimited size limit
const tempStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const tempDir = path.join(__dirname, '..', 'temp_uploads');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    cb(null, `upload_${Date.now()}_${Math.random().toString(36).substr(2, 6)}_${file.originalname}`);
  }
});

const upload = multer({
  storage: tempStorage,
  limits: { fileSize: 500 * 1024 * 1024 } // 500MB per file
});

// POST /api/send (Supports multiple files or single text input)
router.post('/send', authenticateJWT, upload.array('files', 10), async (req, res) => {
  try {
    const sender = req.user.username;
    const { receiver, textContent, isText } = req.body;

    if (!receiver || typeof receiver !== 'string') {
      return res.status(400).json({ error: 'Receiver username is required.' });
    }

    const cleanReceiver = receiver.trim();
    const recipientUser = await UserStore.findByUsername(cleanReceiver);

    if (!recipientUser) {
      return res.status(404).json({ error: `User "${cleanReceiver}" does not exist.` });
    }

    const createdMessages = [];
    const io = req.app.get('socketio');

    // Case 1: Text message -> Convert to .txt file automatically
    if (isText === 'true' || isText === true || (textContent && (!req.files || req.files.length === 0))) {
      if (!textContent || !textContent.trim()) {
        return res.status(400).json({ error: 'Text content cannot be empty.' });
      }

      const timestamp = new Date();
      const formattedDate = timestamp.toLocaleString('en-US', {
        dateStyle: 'full',
        timeStyle: 'medium'
      });

      const txtFileName = `message_from_${sender}_${Date.now()}.txt`;
      const txtContent = `Shared by: ${sender}\nDate: ${formattedDate}\n━━━━━━━━━━━━━━━━━━━━\n${textContent.trim()}`;

      const tempDir = path.join(__dirname, '..', 'temp_uploads');
      if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
      const tempPath = path.join(tempDir, txtFileName);

      fs.writeFileSync(tempPath, txtContent, 'utf8');

      // Upload to Cloudinary / storage
      const uploadRes = await uploadFile(tempPath, txtFileName);

      const msg = await MessageStore.create({
        sender,
        receiver: cleanReceiver,
        fileUrl: uploadRes.url,
        fileName: txtFileName,
        fileType: 'text/plain',
        isText: true
      });

      createdMessages.push(msg);
    } 
    // Case 2: Files uploaded (one or multiple)
    else if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const uploadRes = await uploadFile(file.path, file.originalname);

        const msg = await MessageStore.create({
          sender,
          receiver: cleanReceiver,
          fileUrl: uploadRes.url,
          fileName: file.originalname,
          fileType: file.mimetype || 'application/octet-stream',
          isText: false
        });

        createdMessages.push(msg);
      }
    } else {
      return res.status(400).json({ error: 'Please provide either text or at least one file to send.' });
    }

    // Real-time Socket.io delivery if online
    if (io) {
      io.to(`user_${cleanReceiver.toLowerCase()}`).emit('new_file_received', {
        messages: createdMessages,
        sender
      });
    }

    // Web Push Notification to receiver (if push subscription exists)
    if (recipientUser.pushSub) {
      try {
        const payload = JSON.stringify({
          title: 'New File Received',
          body: `${sender} sent you a file`,
          icon: '/favicon.ico',
          data: { url: '/inbox' }
        });
        await webpush.sendNotification(recipientUser.pushSub, payload);
      } catch (pushErr) {
        console.warn('[Web Push Error]', pushErr.message);
      }
    }

    res.status(201).json({
      message: `Successfully sent ${createdMessages.length} file(s) to ${cleanReceiver}`,
      files: createdMessages
    });
  } catch (error) {
    console.error('[Send Error]', error);
    res.status(500).json({ error: 'Failed to send file(s).' });
  }
});

// GET /api/inbox
router.get('/inbox', authenticateJWT, async (req, res) => {
  try {
    const messages = await MessageStore.findForUser(req.user.username);
    const unreadCount = await MessageStore.countUnread(req.user.username);

    res.json({
      username: req.user.username,
      unreadCount,
      messages
    });
  } catch (error) {
    console.error('[Inbox Error]', error);
    res.status(500).json({ error: 'Failed to retrieve inbox messages.' });
  }
});

// POST /api/mark-read (Clear unread notifications for current user)
router.post('/mark-read', authenticateJWT, async (req, res) => {
  try {
    await MessageStore.markAllAsDelivered(req.user.username);
    res.json({ success: true, unreadCount: 0 });
  } catch (error) {
    console.error('[Mark Read Error]', error);
    res.status(500).json({ error: 'Failed to mark messages as read.' });
  }
});

// POST /api/mark-delivered/:id
router.post('/mark-delivered/:id', authenticateJWT, async (req, res) => {
  try {
    const updated = await MessageStore.markAsDelivered(req.params.id);
    res.json({ success: true, message: updated });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update delivery status' });
  }
});

module.exports = router;
