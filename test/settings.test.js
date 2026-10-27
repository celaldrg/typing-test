import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LANGUAGES, MODE_OPTIONS, modeKey, normalizeSettings } from '../src/settings.js';

test('modes are time (15/30/60 s) and words (10/25/50), word lists are English and Turkish', () => {
  assert.deepEqual(MODE_OPTIONS, { time: [15, 30, 60], words: [10, 25, 50] });
  assert.deepEqual(LANGUAGES, ['en', 'tr']);
});

test('normalizeSettings keeps every valid combination', () => {
  for (const [mode, amounts] of Object.entries(MODE_OPTIONS)) {
    for (const amount of amounts) {
      for (const lang of LANGUAGES) {
        assert.deepEqual(normalizeSettings({ mode, amount, lang }), { mode, amount, lang });
      }
    }
  }
});

test('normalizeSettings replaces unknown values with defaults', () => {
  const defaults = { mode: 'time', amount: 30, lang: 'en' };
  assert.deepEqual(normalizeSettings(undefined), defaults);
  assert.deepEqual(normalizeSettings('time'), defaults);
  assert.deepEqual(normalizeSettings({ mode: 'toString', amount: 15 }), { mode: 'time', amount: 15, lang: 'en' });
  assert.deepEqual(normalizeSettings({ mode: 'time', amount: 50, lang: 'tr' }), { mode: 'time', amount: 30, lang: 'tr' });
  assert.deepEqual(normalizeSettings({ mode: 'words', amount: 7, lang: 'de' }), { mode: 'words', amount: 25, lang: 'en' });
});

test('normalizeSettings accepts lengths given as strings, e.g. from a select element', () => {
  assert.deepEqual(normalizeSettings({ mode: 'words', amount: '50', lang: 'tr' }), { mode: 'words', amount: 50, lang: 'tr' });
});

test('modeKey names the mode, the length and the word list language', () => {
  assert.equal(modeKey({ mode: 'time', amount: 60, lang: 'tr' }), 'time-60-tr');
  assert.equal(modeKey({ mode: 'words', amount: 10, lang: 'en' }), 'words-10-en');
});
