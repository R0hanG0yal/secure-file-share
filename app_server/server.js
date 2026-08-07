require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const connectDB = require('./config/db');
const { initVapid } = require('./config/vapid');
const rateLimiter = require('./middleware/rateLimiter');

const authRoutes = require('./routes/auth');
const messageRoutes = require('./routes/messages');
const pushRoutes = require('./routes/push');

const app = express();
const server = http.createServer(app);

// Enable Socket.io with CORS
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Attach socket.io to express app
app.set('socketio', io);

// Initialize DB and VAPID
connectDB();
initVapid();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(rateLimiter);

// Serve uploaded files locally if fallbacked
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api', authRoutes);
app.use('/api', messageRoutes);
app.use('/api/push', pushRoutes);

// Socket.io Realtime User Channels
io.on('connection', (socket) => {
  console.log('[Socket] New client connected:', socket.id);

  socket.on('join_user', (username) => {
    if (username) {
      const room = `user_${username.toLowerCase()}`;
      socket.join(room);
      console.log(`[Socket] Client ${socket.id} joined room ${room}`);
    }
  });

  socket.on('disconnect', () => {
    console.log('[Socket] Client disconnected:', socket.id);
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'DoShare API'
  });
});

// Serve production static React frontend
const clientDistPath = path.join(__dirname, '..', 'app_client', 'dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// -------------------------------------------------------------------
// Render Auto-Sleep Prevention (Ping every 14 minutes)
// -------------------------------------------------------------------
const https = require('https');
const PING_INTERVAL = 14 * 60 * 1000; // 14 minutes
const SELF_URL = process.env.RENDER_EXTERNAL_URL || 'https://doshare-app.onrender.com';
const FLASK_URL = 'https://dageroz.onrender.com';

setInterval(() => {
  // Ping Node server
  console.log(`[Keep-Alive] Pinging Node Server: ${SELF_URL}/api/health`);
  https.get(`${SELF_URL}/api/health`, (resp) => {
    resp.on('data', () => {}); 
    resp.on('end', () => console.log(`[Keep-Alive] Node ping successful`));
  }).on('error', (err) => console.error(`[Keep-Alive] Node ping error: ${err.message}`));

  // Ping Flask server
  console.log(`[Keep-Alive] Pinging Flask Server: ${FLASK_URL}/`);
  https.get(`${FLASK_URL}/`, (resp) => {
    resp.on('data', () => {}); 
    resp.on('end', () => console.log(`[Keep-Alive] Flask ping successful`));
  }).on('error', (err) => console.error(`[Keep-Alive] Flask ping error: ${err.message}`));
}, PING_INTERVAL);
// -------------------------------------------------------------------

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 DOSHARE BACKEND SERVER RUNNING`);
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log(`=======================================================`);
});
