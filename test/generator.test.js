import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createWordGenerator } from '../src/generator.js';
import { createRng } from '../src/rng.js';
import { WORD_LISTS } from '../src/wordlists.js';

/** Draws `count` words from `list` with a generator seeded by `seed`. */
function draw(seed, count, list = WORD_LISTS.en) {
  const nextWord = createWordGenerator(list, createRng(seed));
  return Array.from({ length: count }, () => nextWord());
}

test('createRng repeats its sequence for the same seed', () => {
  const sequence = (seed) => {
    const rng = createRng(seed);
    return Array.from({ length: 100 }, () => rng());
  };
  assert.deepEqual(sequence(123), sequence(123));
  assert.notDeepEqual(sequence(123), sequence(124));
});

test('createRng returns floats in [0, 1)', () => {
  const rng = createRng(99);
  for (let i = 0; i < 10_000; i += 1) {
    const value = rng();
    assert.ok(value >= 0 && value < 1, String(value));
  }
});

test('the word generator is deterministic per seed', () => {
  assert.deepEqual(draw(7, 300), draw(7, 300));
  assert.deepEqual(draw(7, 300, WORD_LISTS.tr), draw(7, 300, WORD_LISTS.tr));
  assert.notDeepEqual(draw(7, 300), draw(8, 300));
});

test('the word generator only returns list words, never the same word twice in a row', () => {
  for (const list of Object.values(WORD_LISTS)) {
    const words = draw(11, 2_000, list);
    assert.ok(words.every((word) => list.includes(word)));
    assert.ok(words.every((word, i) => i === 0 || word !== words[i - 1]));
  }
});

test('the word generator spreads over the whole list', () => {
  const distinct = new Set(draw(5, 5_000));
  assert.ok(distinct.size > WORD_LISTS.en.length * 0.9, `${distinct.size} distinct words`);
});

test('the word generator works with a single word and rejects an empty list', () => {
  assert.deepEqual(draw(1, 3, ['solo']), ['solo', 'solo', 'solo']);
  assert.throws(() => createWordGenerator([], createRng(1)), RangeError);
});
