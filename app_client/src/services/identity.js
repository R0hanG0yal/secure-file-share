import { get as idbGet, set as idbSet } from 'idb-keyval';

const UUID_KEY = 'identishare_device_uuid';
const TOKEN_KEY = 'identishare_token';
const USER_KEY = 'identishare_user';
const CACHE_NAME = 'identishare-identity-v2';
const CACHE_URL = '/__identity_vault__';

// Cookie helpers (10 year expiry)
function setCookie(key, value) {
  const d = new Date();
  d.setTime(d.getTime() + 10 * 365 * 24 * 60 * 60 * 1000);
  document.cookie = `${key}=${encodeURIComponent(value)};expires=${d.toUTCString()};path=/;SameSite=Lax`;
}

function getCookie(key) {
  const name = `${key}=`;
  const decoded = decodeURIComponent(document.cookie);
  const ca = decoded.split(';');
  for (let c of ca) {
    c = c.trim();
    if (c.indexOf(name) === 0) {
      return c.substring(name.length, c.length);
    }
  }
  return null;
}

// CacheStorage helpers
async function setCacheIdentity(data) {
  if ('caches' in window) {
    try {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(CACHE_URL, new Response(JSON.stringify(data)));
    } catch (e) {}
  }
}

async function getCacheIdentity() {
  if ('caches' in window) {
    try {
      const cache = await caches.open(CACHE_NAME);
      const res = await cache.match(CACHE_URL);
      if (res) {
        return await res.json();
      }
    } catch (e) {}
  }
  return null;
}

// Service Worker Cache helper
async function setSWIdentity(data) {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    try {
      navigator.serviceWorker.controller.postMessage({ type: 'SAVE_IDENTITY', payload: data });
    } catch (e) {}
  }
}

// Write Token, Username & UUID to ALL 5 Storage Layers
export async function persistFullIdentity(token, username, uuid) {
  if (!token && !username && !uuid) return;

  const payload = { token, username, uuid, timestamp: Date.now() };

  // 1. localStorage
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    if (username) localStorage.setItem(USER_KEY, username);
    if (uuid) localStorage.setItem(UUID_KEY, uuid);
  } catch (e) {}

  // 2. IndexedDB
  try {
    await idbSet('identity_vault', payload);
  } catch (e) {}

  // 3. Cookie
  try {
    if (token) setCookie(TOKEN_KEY, token);
    if (username) setCookie(USER_KEY, username);
    if (uuid) setCookie(UUID_KEY, uuid);
  } catch (e) {}

  // 4. CacheStorage
  try {
    await setCacheIdentity(payload);
  } catch (e) {}

  // 5. Service Worker
  try {
    await setSWIdentity(payload);
  } catch (e) {}
}

// Cascade Search Across All 5 Storage Layers
export async function detectStoredIdentity() {
  // Layer 1: localStorage
  const localToken = localStorage.getItem(TOKEN_KEY);
  const localUser = localStorage.getItem(USER_KEY);
  const localUUID = localStorage.getItem(UUID_KEY);
  if (localToken && localUser) {
    return { token: localToken, username: localUser, uuid: localUUID, source: 'localStorage' };
  }

  // Layer 2: IndexedDB
  try {
    const idbData = await idbGet('identity_vault');
    if (idbData && idbData.token && idbData.username) {
      await persistFullIdentity(idbData.token, idbData.username, idbData.uuid);
      return { ...idbData, source: 'IndexedDB' };
    }
  } catch (e) {}

  // Layer 3: Cookie
  const cookieToken = getCookie(TOKEN_KEY);
  const cookieUser = getCookie(USER_KEY);
  const cookieUUID = getCookie(UUID_KEY);
  if (cookieToken && cookieUser) {
    await persistFullIdentity(cookieToken, cookieUser, cookieUUID);
    return { token: cookieToken, username: cookieUser, uuid: cookieUUID, source: 'Cookie' };
  }

  // Layer 4: CacheStorage
  const cacheData = await getCacheIdentity();
  if (cacheData && cacheData.token && cacheData.username) {
    await persistFullIdentity(cacheData.token, cacheData.username, cacheData.uuid);
    return { ...cacheData, source: 'CacheStorage' };
  }

  return null;
}

// -------------------------------------------------------------
// BROWSER HARDWARE FINGERPRINTING CASCADE (Canvas + WebGL + Audio + Browser Specs)
// -------------------------------------------------------------

// 1. Canvas Fingerprint
function getCanvasFingerprint() {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 240;
    canvas.height = 140;
    const ctx = canvas.getContext('2d');
    if (!ctx) return 'no_canvas';

    ctx.textBaseline = 'top';
    ctx.font = "14px 'Arial', 'Inter', sans-serif";
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);

    ctx.fillStyle = '#069';
    ctx.fillText('SecureShare Vault, 🔐 100%', 2, 15);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText('Hardware Signature', 4, 45);

    return canvas.toDataURL();
  } catch (e) {
    return 'canvas_err';
  }
}

// 2. WebGL Fingerprint
function getWebGLFingerprint() {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return 'no_webgl';

    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    const vendor = debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : 'vendor';
    const renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'renderer';

    return `${vendor}~${renderer}`;
  } catch (e) {
    return 'webgl_err';
  }
}

// 3. Audio Fingerprint
async function getAudioFingerprint() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return 'no_audio';

    const context = new OfflineAudioContext(1, 44100, 44100);
    const oscillator = context.createOscillator();
    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(10000, context.currentTime);

    const compressor = context.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-50, context.currentTime);
    compressor.knee.setValueAtTime(40, context.currentTime);
    compressor.ratio.setValueAtTime(12, context.currentTime);

    oscillator.connect(compressor);
    compressor.connect(context.destination);

    oscillator.start(0);

    const renderedBuffer = await context.startRendering();
    const data = renderedBuffer.getChannelData(0);
    let sum = 0;
    for (let i = 0; i < data.length; i += 100) {
      sum += Math.abs(data[i]);
    }
    return sum.toString();
  } catch (e) {
    return 'audio_err';
  }
}

// 4. Combined Deterministic Hardware Fingerprint Hash
export async function generateHardwareFingerprint() {
  const canvasFP = getCanvasFingerprint();
  const webglFP = getWebGLFingerprint();
  const audioFP = await getAudioFingerprint();

  const specs = [
    navigator.userAgent,
    navigator.language,
    screen.width,
    screen.height,
    screen.colorDepth,
    navigator.hardwareConcurrency || 4,
    navigator.deviceMemory || 8,
    new Date().getTimezoneOffset()
  ].join('|');

  const rawString = `${canvasFP}:::${webglFP}:::${audioFP}:::${specs}`;

  // Simple string hash code generator
  let hash = 0;
  for (let i = 0; i < rawString.length; i++) {
    const char = rawString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }

  return `fp_${Math.abs(hash).toString(36)}`;
}

// UUID helper
export async function detectOrGenerateUUID() {
  const stored = await detectStoredIdentity();
  if (stored && stored.uuid) return { uuid: stored.uuid, isNew: false };

  const newUUID = typeof crypto !== 'undefined' && crypto.randomUUID 
    ? crypto.randomUUID() 
    : 'uuid_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15);

  return { uuid: newUUID, isNew: true };
}
