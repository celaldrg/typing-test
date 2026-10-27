import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  STRINGS,
  UI_LANGUAGES,
  describeTest,
  formatNumber,
  formatPercent,
  normalizeUiLanguage,
  otherUiLanguage,
  restartActionKeys,
  translate,
} from '../src/i18n.js';

const placeholders = (text) => [...text.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort();

test('English and Turkish define the same keys', () => {
  assert.deepEqual(UI_LANGUAGES, ['en', 'tr']);
  assert.deepEqual(Object.keys(STRINGS.tr).sort(), Object.keys(STRINGS.en).sort());
});

test('no interface string is empty', () => {
  for (const lang of UI_LANGUAGES) {
    for (const [key, text] of Object.entries(STRINGS[lang])) {
      assert.ok(text.trim() !== '', `${lang}.${key} is empty`);
    }
  }
});

test('both languages use the same placeholders in each string', () => {
  for (const key of Object.keys(STRINGS.en)) {
    assert.deepEqual(placeholders(STRINGS.tr[key]), placeholders(STRINGS.en[key]), key);
  }
});

test('every key used by index.html exists', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const keys = [...html.matchAll(/data-i18n(?:-aria|-title)?="([^"]+)"/g)].map((match) => match[1]);
  assert.ok(keys.length > 20);
  for (const key of keys) assert.ok(key in STRINGS.en, `missing key ${key}`);
});

test('the language toggle shows the language it switches to', () => {
  assert.equal(STRINGS.en.langToggle, 'TR');
  assert.equal(STRINGS.tr.langToggle, 'EN');
  assert.equal(otherUiLanguage('en'), 'tr');
  assert.equal(otherUiLanguage('tr'), 'en');
});

test('normalizeUiLanguage keeps en and tr and falls back to English', () => {
  assert.equal(normalizeUiLanguage('tr'), 'tr');
  assert.equal(normalizeUiLanguage('en'), 'en');
  assert.equal(normalizeUiLanguage('de'), 'en');
  assert.equal(normalizeUiLanguage(null), 'en');
  assert.equal(normalizeUiLanguage(undefined), 'en');
});

test('translate fills placeholders', () => {
  assert.equal(translate('en', 'length.time', { n: 30 }), '30 seconds');
  assert.equal(translate('tr', 'length.words', { n: 25 }), '25 kelime');
  assert.equal(translate('tr', 'results.best', { wpm: '71' }), 'En iyi: 71 kelime/dk');
});

test('translate keeps placeholders without a value', () => {
  assert.equal(translate('en', 'length.time'), '{n} seconds');
});

test('translate falls back to English, then to the key', () => {
  assert.equal(translate('de', 'restart'), 'Restart');
  assert.equal(translate('tr', 'restart'), 'Yeniden başlat');
  assert.equal(translate('tr', 'no.such.key'), 'no.such.key');
});

test('the key hint names the same action as the restart button on each screen', () => {
  for (const lang of UI_LANGUAGES) {
    for (const finished of [false, true]) {
      const { label, hint } = restartActionKeys(finished);
      assert.ok(label in STRINGS[lang] && hint in STRINGS[lang], `${lang} ${label} ${hint}`);
      assert.equal(translate(lang, hint), translate(lang, label).toLowerCase(), `${lang} ${hint}`);
    }
  }
  assert.equal(translate('en', restartActionKeys(true).hint), 'next test');
  assert.equal(translate('tr', restartActionKeys(true).hint), 'sonraki test');
});

test('formatNumber uses the separators of each language', () => {
  assert.equal(formatNumber(1234, 'en'), '1,234');
  assert.equal(formatNumber(1234, 'tr'), '1.234');
  assert.equal(formatNumber(71.6, 'en'), '72');
  assert.equal(formatNumber(71.64, 'en', 1), '71.6');
  assert.equal(formatNumber(71.6, 'tr', 1), '71,6');
  assert.equal(formatNumber(30, 'tr', 2), '30,00');
});

test('formatPercent puts the percent sign where each language expects it', () => {
  assert.equal(formatPercent(97.9, 'en'), '98%');
  assert.equal(formatPercent(97.9, 'tr'), '%98');
  assert.equal(formatPercent(97.89, 'tr', 1), '%97,9');
  assert.equal(formatPercent(100, 'en'), '100%');
});

test('describeTest names mode, length and word list in the interface language', () => {
  assert.equal(describeTest({ mode: 'time', amount: 30, lang: 'en' }, 'en'), 'time 30 · English');
  assert.equal(describeTest({ mode: 'words', amount: 25, lang: 'tr' }, 'tr'), 'kelime 25 · Türkçe');
  assert.equal(describeTest({ mode: 'time', amount: 15, lang: 'tr' }, 'en'), 'time 15 · Turkish');
});
