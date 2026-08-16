import { get as idbGet, set as idbSet, del as idbDel } from 'idb-keyval';

const TOKEN_KEY = 'doshare_token';
const USER_KEY = 'doshare_user';
const UUID_KEY = 'doshare_device_uuid';

const LEGACY_TOKEN_KEY = 'identishare_token';
const LEGACY_USER_KEY = 'identishare_user';
const LEGACY_UUID_KEY = 'identishare_device_uuid';

// Cookie helpers (10 year expiry)
function setCookie(key, value) {
  try {
    const d = new Date();
    d.setTime(d.getTime() + 10 * 365 * 24 * 60 * 60 * 1000);
    document.cookie = `${key}=${encodeURIComponent(value)};expires=${d.toUTCString()};path=/;SameSite=Lax`;
  } catch (e) {}
}

function getCookie(key) {
  try {
    const name = `${key}=`;
    const decoded = decodeURIComponent(document.cookie);
    const ca = decoded.split(';');
    for (let c of ca) {
      c = c.trim();
      if (c.indexOf(name) === 0) {
        return c.substring(name.length, c.length);
      }
    }
  } catch (e) {}
  return null;
}

function removeCookie(key) {
  try {
    document.cookie = `${key}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;SameSite=Lax`;
  } catch (e) {}
}

// Write Token, Username & UUID to Storage Layers
export async function persistFullIdentity(token, username, uuid) {
  if (!token && !username && !uuid) return;

  const payload = { token, username, uuid, timestamp: Date.now() };

  // 1. localStorage
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(LEGACY_TOKEN_KEY, token);
    }
    if (username) {
      localStorage.setItem(USER_KEY, username);
      localStorage.setItem(LEGACY_USER_KEY, username);
    }
    if (uuid) {
      localStorage.setItem(UUID_KEY, uuid);
      localStorage.setItem(LEGACY_UUID_KEY, uuid);
    }
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
}

// Clear all identity records on logout
export async function clearStoredIdentity() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(LEGACY_TOKEN_KEY);
    localStorage.removeItem(LEGACY_USER_KEY);
  } catch (e) {}

  try {
    removeCookie(TOKEN_KEY);
    removeCookie(USER_KEY);
    removeCookie(LEGACY_TOKEN_KEY);
    removeCookie(LEGACY_USER_KEY);
  } catch (e) {}

  try {
    await idbDel('identity_vault');
  } catch (e) {}
}

// Detect existing stored session for this specific browser
export async function detectStoredIdentity() {
  // Layer 1: localStorage
  let localToken = localStorage.getItem(TOKEN_KEY) || localStorage.getItem(LEGACY_TOKEN_KEY);
  let localUser = localStorage.getItem(USER_KEY) || localStorage.getItem(LEGACY_USER_KEY);
  let localUUID = localStorage.getItem(UUID_KEY) || localStorage.getItem(LEGACY_UUID_KEY);

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
  const cookieToken = getCookie(TOKEN_KEY) || getCookie(LEGACY_TOKEN_KEY);
  const cookieUser = getCookie(USER_KEY) || getCookie(LEGACY_USER_KEY);
  const cookieUUID = getCookie(UUID_KEY) || getCookie(LEGACY_UUID_KEY);

  if (cookieToken && cookieUser) {
    await persistFullIdentity(cookieToken, cookieUser, cookieUUID);
    return { token: cookieToken, username: cookieUser, uuid: cookieUUID, source: 'Cookie' };
  }

  return null;
}

// Generate unique device UUID per browser installation
export async function detectOrGenerateUUID() {
  let existing = localStorage.getItem(UUID_KEY) || localStorage.getItem(LEGACY_UUID_KEY);
  if (existing) return { uuid: existing, isNew: false };

  const newUUID = (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : 'uuid_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15);

  try {
    localStorage.setItem(UUID_KEY, newUUID);
    localStorage.setItem(LEGACY_UUID_KEY, newUUID);
  } catch (e) {}

  return { uuid: newUUID, isNew: true };
}
