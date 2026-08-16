const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: String,
    required: true,
    index: true
  },
  receiver: {
    type: String,
    required: true,
    index: true
  },
  fileUrl: {
    type: String,
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  fileType: {
    type: String,
    default: 'application/octet-stream'
  },
  isText: {
    type: Boolean,
    default: false
  },
  delivered: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

let MessageModel;
try {
  MessageModel = mongoose.model('Message', messageSchema);
} catch (e) {
  MessageModel = mongoose.model('Message');
}

// In-Memory Data Fallback for Messages
let memoryMessages = [];

const MessageStore = {
  async create({ sender, receiver, fileUrl, fileName, fileType, isText }) {
    if (mongoose.connection.readyState === 1) {
      const msg = new MessageModel({ sender, receiver, fileUrl, fileName, fileType, isText });
      return await msg.save();
    } else {
      const msg = {
        _id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        sender,
        receiver,
        fileUrl,
        fileName,
        fileType: fileType || 'application/octet-stream',
        isText: !!isText,
        delivered: false,
        createdAt: new Date()
      };
      memoryMessages.push(msg);
      return msg;
    }
  },

  async findById(id) {
    if (mongoose.connection.readyState === 1) {
      return await MessageModel.findById(id);
    } else {
      return memoryMessages.find(m => m._id.toString() === id.toString()) || null;
    }
  },

  async findForUser(username) {
    if (mongoose.connection.readyState === 1) {
      return await MessageModel.find({ receiver: new RegExp(`^${username}$`, 'i') }).sort({ createdAt: -1 });
    } else {
      return memoryMessages
        .filter(m => m.receiver.toLowerCase() === username.toLowerCase())
        .sort((a, b) => b.createdAt - a.createdAt);
    }
  },

  async markAsDelivered(id) {
    if (mongoose.connection.readyState === 1) {
      return await MessageModel.findByIdAndUpdate(id, { delivered: true }, { new: true });
    } else {
      const msg = memoryMessages.find(m => m._id.toString() === id.toString());
      if (msg) {
        msg.delivered = true;
      }
      return msg;
    }
  },

  async markAllAsDelivered(username) {
    if (mongoose.connection.readyState === 1) {
      await MessageModel.updateMany(
        { receiver: new RegExp(`^${username}$`, 'i'), delivered: false },
        { delivered: true }
      );
    } else {
      memoryMessages.forEach(m => {
        if (m.receiver.toLowerCase() === username.toLowerCase()) {
          m.delivered = true;
        }
      });
    }
  },

  async countUnread(username) {
    if (mongoose.connection.readyState === 1) {
      return await MessageModel.countDocuments({ receiver: new RegExp(`^${username}$`, 'i'), delivered: false });
    } else {
      return memoryMessages.filter(m => m.receiver.toLowerCase() === username.toLowerCase() && !m.delivered).length;
    }
  },

  async deleteMessage(id, username) {
    if (mongoose.connection.readyState === 1) {
      // Allow deletion if the user is the receiver or sender
      return await MessageModel.findOneAndDelete({
        _id: id,
        $or: [
          { receiver: new RegExp(`^${username}$`, 'i') },
          { sender: new RegExp(`^${username}$`, 'i') }
        ]
      });
    } else {
      const index = memoryMessages.findIndex(m =>
        m._id.toString() === id.toString() &&
        (m.receiver.toLowerCase() === username.toLowerCase() || m.sender.toLowerCase() === username.toLowerCase())
      );
      if (index !== -1) {
        const deleted = memoryMessages[index];
        memoryMessages.splice(index, 1);
        return deleted;
      }
      return null;
    }
  }
};

module.exports = MessageStore;
