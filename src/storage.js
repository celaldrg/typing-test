/**
 * The only module that touches localStorage. Every read and write is wrapped
 * in try/catch, so blocked storage (private mode, disabled cookies, full
 * quota) never crashes the app. Keys get an app prefix because every app on
 * the same GitHub Pages origin shares one localStorage.
 */

const PREFIX = 'typing-test:';

/** @typedef {Pick<Storage, 'getItem' | 'setItem'>} StorageLike */

/** Returns the browser's localStorage, or null when it is missing or blocked. */
function browserStorage() {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

/**
 * Reads a JSON value. Never throws.
 * @param {string} key - key without the app prefix
 * @param {*} fallback - returned when the value is missing, unreadable or storage is unavailable
 * @param {StorageLike | null} [backend] - storage to use; defaults to localStorage
 * @returns {*} the parsed value or `fallback`
 */
export function readJSON(key, fallback, backend = browserStorage()) {
  try {
    const raw = backend ? backend.getItem(PREFIX + key) : null;
    return raw == null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

/**
 * Writes a value as JSON. Never throws.
 * @param {string} key - key without the app prefix
 * @param {*} value - any JSON-serializable value
 * @param {StorageLike | null} [backend] - storage to use; defaults to localStorage
 * @returns {boolean} true when the value was stored
 */
export function writeJSON(key, value, backend = browserStorage()) {
  try {
    if (!backend) return false;
    backend.setItem(PREFIX + key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
