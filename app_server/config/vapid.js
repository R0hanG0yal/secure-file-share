const webpush = require('web-push');
const fs = require('fs');
const path = require('path');

let vapidKeys = {};

const envPath = path.join(__dirname, '..', '.env');

function initVapid() {
  if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    vapidKeys = {
      publicKey: process.env.VAPID_PUBLIC_KEY,
      privateKey: process.env.VAPID_PRIVATE_KEY
    };
  } else {
    // Generate new VAPID keys on startup if missing
    vapidKeys = webpush.generateVAPIDKeys();
    process.env.VAPID_PUBLIC_KEY = vapidKeys.publicKey;
    process.env.VAPID_PRIVATE_KEY = vapidKeys.privateKey;
    
    console.log('--- AUTO GENERATED VAPID KEYS ---');
    console.log('Public Key:', vapidKeys.publicKey);
    console.log('Private Key:', vapidKeys.privateKey);
    console.log('--------------------------------');
  }

  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:admin@identishare.local',
    vapidKeys.publicKey,
    vapidKeys.privateKey
  );

  return vapidKeys;
}

module.exports = { initVapid, getVapidKeys: () => vapidKeys };
