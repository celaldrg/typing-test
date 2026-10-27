import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createDemoGame } from '../src/demo.js';
import { getBest, saveBest } from '../src/records.js';

const TIME_30_EN = Object.freeze({ mode: 'time', amount: 30, lang: 'en' });

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

/** A finished result of a 30-second English time test unless `settings` says otherwise. */
function resultOf(wpm, accuracy, settings = {}) {
  return {
    ...TIME_30_EN,
    durationMs: 30_000,
    wpm,
    raw: wpm + 4,
    accuracy,
    consistency: 80,
    errors: 3,
    ...settings,
  };
}

test('the first result of a mode becomes its best', () => {
  const storage = memoryStorage();
  assert.equal(getBest(TIME_30_EN, storage), null);
  const saved = saveBest(resultOf(70, 96), storage);
  assert.equal(saved.isNew, true);
  assert.deepEqual(saved.best, { wpm: 70, raw: 74, accuracy: 96, consistency: 80 });
  assert.deepEqual(getBest(TIME_30_EN, storage), saved.best);
});

test('a faster result replaces the best, a slower one keeps it', () => {
  const storage = memoryStorage();
  const first = saveBest(resultOf(70, 96), storage).best;
  assert.deepEqual(saveBest(resultOf(65, 99), storage), { best: first, isNew: false });
  assert.equal(getBest(TIME_30_EN, storage).wpm, 70);
  assert.equal(saveBest(resultOf(75, 90), storage).isNew, true);
  assert.equal(getBest(TIME_30_EN, storage).wpm, 75);
});

test('equal WPM is decided by accuracy', () => {
  const storage = memoryStorage();
  saveBest(resultOf(70, 95), storage);
  assert.equal(saveBest(resultOf(70, 95), storage).isNew, false);
  assert.equal(saveBest(resultOf(70, 97), storage).isNew, true);
  assert.equal(getBest(TIME_30_EN, storage).accuracy, 97);
});

test('each mode, length and word list language keeps its own best', () => {
  const storage = memoryStorage();
  saveBest(resultOf(70, 96), storage);
  saveBest(resultOf(50, 96, { lang: 'tr' }), storage);
  saveBest(resultOf(60, 96, { mode: 'words', amount: 25 }), storage);
  assert.equal(getBest(TIME_30_EN, storage).wpm, 70);
  assert.equal(getBest({ mode: 'time', amount: 30, lang: 'tr' }, storage).wpm, 50);
  assert.equal(getBest({ mode: 'words', amount: 25, lang: 'en' }, storage).wpm, 60);
  assert.equal(getBest({ mode: 'time', amount: 60, lang: 'en' }, storage), null);
});

test('a result with 0 WPM is never stored', () => {
  const storage = memoryStorage();
  assert.deepEqual(saveBest(resultOf(0, 0), storage), { best: null, isNew: false });
  assert.equal(storage.items.size, 0);
});

test('records live under one prefixed storage key', () => {
  const storage = memoryStorage();
  saveBest(resultOf(70, 96), storage);
  assert.deepEqual([...storage.items.keys()], ['typing-test:best']);
});

test('corrupted stored records are ignored and replaced', () => {
  const storage = memoryStorage();
  storage.items.set('typing-test:best', '"oops"');
  assert.equal(getBest(TIME_30_EN, storage), null);
  storage.items.set('typing-test:best', JSON.stringify({ 'time-30-en': { wpm: 'fast' } }));
  assert.equal(getBest(TIME_30_EN, storage), null);
  assert.equal(saveBest(resultOf(70, 96), storage).isNew, true);
  assert.equal(getBest(TIME_30_EN, storage).wpm, 70);
});

test('blocked storage never throws', () => {
  const blocked = {
    getItem() {
      throw new Error('SecurityError');
    },
    setItem() {
      throw new Error('SecurityError');
    },
  };
  assert.equal(getBest(TIME_30_EN, blocked), null);
  assert.equal(saveBest(resultOf(70, 96), blocked).isNew, true);
});

test('the result of a finished game can be saved and read back', () => {
  const storage = memoryStorage();
  const { result } = createDemoGame().getState();
  assert.equal(saveBest(result, storage).isNew, true);
  assert.equal(getBest(result, storage).wpm, result.wpm);
});
