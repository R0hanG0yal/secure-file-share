const mongoose = require('mongoose');

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

const memoryUsers = new Map();

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
      }
      return user;
    }
  }
};

module.exports = UserStore;
