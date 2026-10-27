import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LANGUAGES } from '../src/settings.js';
import { WORD_LISTS } from '../src/wordlists.js';

test('there is a word list for every language', () => {
  assert.deepEqual(Object.keys(WORD_LISTS), [...LANGUAGES]);
});

for (const [lang, list] of Object.entries(WORD_LISTS)) {
  test(`${lang}: about 250 words`, () => {
    assert.ok(list.length >= 240 && list.length <= 260, `${list.length} words`);
  });

  test(`${lang}: no duplicates`, () => {
    const seen = new Set();
    for (const word of list) {
      assert.ok(!seen.has(word), `duplicate "${word}"`);
      seen.add(word);
    }
  });

  test(`${lang}: no empty entries`, () => {
    for (const word of list) {
      assert.equal(typeof word, 'string');
      assert.notEqual(word.trim(), '');
    }
  });

  test(`${lang}: single lowercase words in Unicode NFC form`, () => {
    for (const word of list) {
      assert.match(word, /^\p{Ll}+$/u);
      assert.equal(word, word.normalize('NFC'));
    }
  });
}

test('en: only the letters a-z', () => {
  for (const word of WORD_LISTS.en) assert.match(word, /^[a-z]+$/);
});

test('tr: only Turkish letters, with ç ğ ı ö ş ü and both i and ı in use', () => {
  for (const word of WORD_LISTS.tr) assert.match(word, /^[abcçdefgğhıijklmnoöprsştuüvyz]+$/);
  const letters = new Set(WORD_LISTS.tr.join(''));
  for (const letter of 'çğıiöşü') assert.ok(letters.has(letter), `no word with "${letter}"`);
});
