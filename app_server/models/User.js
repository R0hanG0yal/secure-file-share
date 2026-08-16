const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 20
  },
  pinHash: {
    type: String,
    required: true
  },
  uuid: {
    type: String,
    required: true,
    index: true
  },
  fingerprint: {
    type: String,
    default: '',
    index: true
  },
  pushSub: {
    type: Object,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

let UserModel;
try {
  UserModel = mongoose.model('User', userSchema);
} catch (e) {
  UserModel = mongoose.model('User');
}

// ── Persistent Disk/Memory Fallback Store ──────────────────────────
const DATA_DIR = path.join(__dirname, '..', 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (e) {}
}

const memoryUsers = new Map();

function loadUsersFromDisk() {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const raw = fs.readFileSync(USERS_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        parsed.forEach(user => memoryUsers.set(user._id || user.username, user));
      }
    }
  } catch (err) {
    console.warn('[UserStore] Error reading users.json fallback:', err.message);
  }
}

function saveUsersToDisk() {
  try {
    const list = Array.from(memoryUsers.values());
    fs.writeFileSync(USERS_FILE, JSON.stringify(list, null, 2), 'utf8');
  } catch (err) {
    console.warn('[UserStore] Error saving users.json fallback:', err.message);
  }
}

// Initial load
loadUsersFromDisk();

const UserStore = {
  async findByUsername(username) {
    if (mongoose.connection.readyState === 1) {
      return await UserModel.findOne({ username: new RegExp(`^${username}$`, 'i') });
    } else {
      for (const user of memoryUsers.values()) {
        if (user.username.toLowerCase() === username.toLowerCase()) return user;
      }
      return null;
    }
  },

  async findByUUID(uuid) {
    if (mongoose.connection.readyState === 1) {
      return await UserModel.findOne({ uuid });
    } else {
      for (const user of memoryUsers.values()) {
        if (user.uuid === uuid) return user;
      }
      return null;
    }
  },

  async findByFingerprint(fingerprint) {
    if (!fingerprint) return null;
    if (mongoose.connection.readyState === 1) {
      return await UserModel.findOne({ fingerprint });
    } else {
      for (const user of memoryUsers.values()) {
        if (user.fingerprint === fingerprint) return user;
      }
      return null;
    }
  },

  async create({ username, pinHash, uuid, fingerprint, pushSub }) {
    if (mongoose.connection.readyState === 1) {
      const user = new UserModel({ username, pinHash, uuid, fingerprint: fingerprint || '', pushSub });
      return await user.save();
    } else {
      const user = {
        _id: 'mem_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        username,
        pinHash,
        uuid,
        fingerprint: fingerprint || '',
        pushSub: pushSub || null,
        createdAt: new Date()
      };
      memoryUsers.set(user._id, user);
      saveUsersToDisk();
      return user;
    }
  },

  async updateFingerprint(userId, fingerprint) {
    if (!fingerprint) return;
    if (mongoose.connection.readyState === 1) {
      return await UserModel.findByIdAndUpdate(userId, { fingerprint }, { new: true });
    } else {
      const user = memoryUsers.get(userId);
      if (user) {
        user.fingerprint = fingerprint;
        saveUsersToDisk();
      }
      return user;
    }
  },

  async updateUUID(userId, newUUID) {
    if (mongoose.connection.readyState === 1) {
      return await UserModel.findByIdAndUpdate(userId, { uuid: newUUID }, { new: true });
    } else {
      const user = memoryUsers.get(userId);
      if (user) {
        user.uuid = newUUID;
        saveUsersToDisk();
      }
      return user;
    }
  },

  async updatePushSub(userId, pushSub) {
    if (mongoose.connection.readyState === 1) {
      return await UserModel.findByIdAndUpdate(userId, { pushSub }, { new: true });
    } else {
      const user = memoryUsers.get(userId);
      if (user) {
        user.pushSub = pushSub;
        saveUsersToDisk();
      }
      return user;
    }
  },

  async updatePin(userId, newPinHash) {
    if (mongoose.connection.readyState === 1) {
      return await UserModel.findByIdAndUpdate(userId, { pinHash: newPinHash }, { new: true });
    } else {
      const user = memoryUsers.get(userId);
      if (user) {
        user.pinHash = newPinHash;
        saveUsersToDisk();
      }
      return user;
    }
  }
};

module.exports = UserStore;
