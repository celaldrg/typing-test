import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readJSON, writeJSON } from '../src/storage.js';

function memoryStorage() {
  const items = new Map();
  return {
    items,
    getItem: (key) => (items.has(key) ? items.get(key) : null),
    setItem: (key, value) => {
      items.set(key, String(value));
    },
  };
}

const blockedStorage = {
  getItem() {
    throw new Error('SecurityError');
  },
  setItem() {
    throw new Error('QuotaExceededError');
  },
};

test('writeJSON and readJSON round-trip values under the app prefix', () => {
  const storage = memoryStorage();
  assert.equal(writeJSON('settings', { mode: 'words', amount: 25 }, storage), true);
  assert.deepEqual([...storage.items.keys()], ['typing-test:settings']);
  assert.deepEqual(readJSON('settings', null, storage), { mode: 'words', amount: 25 });
});

test('readJSON returns the fallback for missing or invalid values', () => {
  const storage = memoryStorage();
  assert.equal(readJSON('missing', 'fallback', storage), 'fallback');
  storage.items.set('typing-test:broken', '{not json');
  assert.equal(readJSON('broken', 'fallback', storage), 'fallback');
});

test('blocked or missing storage never throws', () => {
  assert.equal(readJSON('ui', 'en', blockedStorage), 'en');
  assert.equal(writeJSON('ui', 'tr', blockedStorage), false);
  assert.equal(readJSON('ui', 'en', null), 'en');
  assert.equal(writeJSON('ui', 'tr', null), false);
});

test('without a backend it uses localStorage and survives a throwing localStorage getter', (t) => {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  t.after(() => {
    if (original) Object.defineProperty(globalThis, 'localStorage', original);
    else delete globalThis.localStorage;
  });
  const storage = memoryStorage();
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, get: () => storage });
  assert.equal(writeJSON('ui', 'tr'), true);
  assert.equal(readJSON('ui', 'en'), 'tr');
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    get() {
      throw new Error('SecurityError');
    },
  });
  assert.equal(readJSON('ui', 'en'), 'en');
  assert.equal(writeJSON('ui', 'tr'), false);
});
