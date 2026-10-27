import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MAX_EXTRA_CHARS, createGame } from '../src/game.js';
import { consistency } from '../src/metrics.js';
import { MODE_OPTIONS } from '../src/settings.js';
import { WORD_LISTS } from '../src/wordlists.js';

/** Returns a word source that repeats `list` in order. */
function wordsFrom(list) {
  let index = 0;
  return () => list[index++ % list.length];
}

/** Presses `keys` one by one, `stepMs` apart, starting at `startMs`; "\b" is Backspace. */
function play(game, keys, startMs = 0, stepMs = 250) {
  [...keys].forEach((key, i) => {
    const now = startMs + i * stepMs;
    if (key === '\b') game.backspace(now);
    else game.type(key, now);
  });
}

/** Creates a 15-second time test over the given words. */
function timeTest(list, lang = 'en') {
  return createGame({ mode: 'time', amount: 15, lang, nextWord: wordsFrom(list) });
}

/** Ends a 15-second test that started at 0 and returns its result. */
function finish15(game) {
  game.update(15_000);
  return game.getState().result;
}

/** Creates a 10-word test over the given words. */
function wordsTest(list) {
  return createGame({ mode: 'words', amount: 10, nextWord: wordsFrom(list) });
}

test('WPM, raw WPM and accuracy: a perfect 10-word test', () => {
  const words = ['time', 'word', 'fast', 'type', 'keep', 'calm', 'road', 'test', 'more', 'line'];
  const game = wordsTest(words);
  // 40 letters + 9 spaces = 49 keystrokes, 250 ms apart: 12 s from the first to the last
  play(game, words.join(' '), 1_000);
  const { status, result } = game.getState();
  assert.equal(status, 'finished');
  assert.equal(result.durationMs, 12_000);
  assert.equal(result.wpm, 49);
  assert.equal(result.raw, 49);
  assert.equal(result.accuracy, 100);
  assert.equal(result.errors, 0);
  assert.deepEqual(result.chars, { correct: 40, incorrect: 0, extra: 0, missed: 0 });
});

test('WPM, raw WPM and accuracy: typos, a correction and a wrong word', () => {
  const game = wordsTest(['one', 'two', 'six', 'ten', 'red', 'sun', 'map', 'cup', 'pen', 'box']);
  // "twx" stays wrong; in "six" the typo "a" is deleted and fixed
  play(game, 'one twx sa\bix ten red sun map cup pen box');
  const { result } = game.getState();
  // 41 key presses (40 characters + 1 Backspace), 250 ms apart: 10 s
  assert.equal(result.durationMs, 10_000);
  // net: 8 correct words with their Space (8 * 4) + "box" (3) = 35 characters
  assert.equal(result.wpm, 42);
  // raw: all 40 typed characters, the deleted "a" included
  assert.equal(result.raw, 48);
  // 38 of 40 keystrokes were right: only "x" and "a" were wrong
  assert.equal(result.accuracy, 95);
  assert.equal(result.errors, 2);
  assert.deepEqual(result.chars, { correct: 29, incorrect: 1, extra: 0, missed: 0 });
});

test('WPM, raw WPM and accuracy: a time test divides by its full length', () => {
  const game = timeTest(['one', 'two', 'six']);
  play(game, 'one two six', 0, 100);
  game.update(14_999);
  assert.equal(game.getState().status, 'running');
  const result = finish15(game);
  assert.equal(result.durationMs, 15_000);
  // "one " + "two " + "six" = 11 characters in 15 s
  assert.equal(result.wpm, 8.8);
  assert.equal(result.raw, 8.8);
  assert.equal(result.accuracy, 100);
});

test('a time test counts the unfinished last word only while it is error-free', () => {
  const clean = timeTest(['one', 'two']);
  play(clean, 'one tw', 0, 100);
  assert.equal(finish15(clean).wpm, 4.8); // "one " + "tw" = 6 characters
  const typo = timeTest(['one', 'two']);
  play(typo, 'one tx', 0, 100);
  assert.equal(finish15(typo).wpm, 3.2); // only "one " = 4 characters
});

test('the clock starts with the first letter, not with Space or Backspace', () => {
  const game = createGame({ mode: 'time', amount: 15, seed: 9 });
  game.update(5_000);
  game.type(' ', 5_000);
  game.backspace(5_000);
  let state = game.getState();
  assert.equal(state.status, 'ready');
  assert.equal(state.elapsedMs, 0);
  assert.equal(state.remainingMs, 15_000);
  game.type(state.words[0][0], 6_000);
  game.update(10_000);
  state = game.getState();
  assert.equal(state.status, 'running');
  assert.equal(state.elapsedMs, 4_000);
  assert.equal(state.remainingMs, 11_000);
  game.update(60_000);
  state = game.getState();
  assert.equal(state.status, 'finished');
  assert.equal(state.result.durationMs, 15_000);
  assert.equal(state.remainingMs, 0);
});

test('keys after the end of a test are ignored', () => {
  const game = timeTest(['one']);
  play(game, 'on', 0, 100);
  finish15(game);
  game.type('e', 15_001);
  game.backspace(15_002);
  assert.deepEqual(game.getState().inputs, ['on']);
});

test('Backspace deletes letters of the current word', () => {
  const game = timeTest(['cat', 'dog']);
  play(game, 'cax\b\b');
  assert.deepEqual(game.getState().inputs, ['c']);
});

test('Backspace does not return into a correctly typed word', () => {
  const game = timeTest(['cat', 'dog']);
  play(game, 'cat \b\b');
  const state = game.getState();
  assert.equal(state.wordIndex, 1);
  assert.deepEqual(state.inputs, ['cat', '']);
});

test('Backspace returns into a previous word with errors and keeps its text', () => {
  const game = timeTest(['cat', 'dog']);
  play(game, 'cot \b');
  let state = game.getState();
  assert.equal(state.wordIndex, 0);
  assert.deepEqual(state.inputs, ['cot']);
  play(game, '\b\bat \b', 2_000);
  state = game.getState();
  assert.equal(state.wordIndex, 1); // "cat" is correct now, so the last Backspace stays put
  assert.deepEqual(state.inputs, ['cat', '']);
});

test('Backspace walks back through several words with errors', () => {
  const game = timeTest(['cat', 'dog', 'sun']);
  play(game, 'cxt dxg \b\b\b\b\b');
  const state = game.getState();
  assert.equal(state.wordIndex, 0);
  assert.deepEqual(state.inputs, ['cxt']);
});

test('a word left early with Space has errors, so Backspace can return to it', () => {
  const game = timeTest(['house', 'cat']);
  play(game, 'ho \b');
  const state = game.getState();
  assert.equal(state.wordIndex, 0);
  assert.deepEqual(state.inputs, ['ho']);
});

test('Backspace on the first word with nothing typed does nothing', () => {
  const game = timeTest(['cat']);
  play(game, 'c\b\b\b');
  const state = game.getState();
  assert.equal(state.wordIndex, 0);
  assert.deepEqual(state.inputs, ['']);
});

test('Backspace deletes letters but not their mistakes from accuracy', () => {
  const game = timeTest(['cat']);
  play(game, 'cx\bat', 0, 100);
  const result = finish15(game);
  assert.equal(result.errors, 1);
  assert.equal(result.accuracy, 75); // c, x, a, t: 3 of 4 right
  assert.equal(result.raw, 3.2); // 4 typed characters in 15 s
  assert.equal(result.wpm, 2.4); // "cat" = 3 characters in 15 s
});

test('Space in the middle of a word skips its remaining letters', () => {
  const game = timeTest(['house', 'cat']);
  play(game, 'ho cat', 0, 100);
  assert.equal(game.getState().wordIndex, 1);
  const result = finish15(game);
  assert.deepEqual(result.chars, { correct: 5, incorrect: 0, extra: 0, missed: 3 });
  assert.equal(result.errors, 1); // the early Space
  assert.equal(result.accuracy, 500 / 6); // 5 of 6 keystrokes right
  assert.equal(result.wpm, 2.4); // only "cat" counts
});

test('Space on an empty word is ignored', () => {
  const game = timeTest(['cat', 'dog']);
  play(game, 'cat  ', 0, 100);
  assert.equal(game.getState().wordIndex, 1);
  const result = finish15(game);
  assert.equal(result.accuracy, 100);
  assert.equal(result.raw, 3.2); // c, a, t and one Space
});

test('letters typed past the end of a word are extra, incorrect and capped', () => {
  const game = timeTest(['cat']);
  play(game, `cat${'x'.repeat(MAX_EXTRA_CHARS + 5)}`, 0, 50);
  assert.equal(game.getState().inputs[0], `cat${'x'.repeat(MAX_EXTRA_CHARS)}`);
  const result = finish15(game);
  assert.equal(result.chars.extra, MAX_EXTRA_CHARS);
  assert.equal(result.errors, MAX_EXTRA_CHARS);
  assert.equal(result.wpm, 0);
});

test('Turkish: typing i for ı, ı for i, I for İ or İ for I is an error', () => {
  const cases = [
    ['ılık', 'i'], ['ılık', 'I'],
    ['için', 'ı'], ['için', 'İ'],
    ['İnce', 'I'], ['İnce', 'i'],
    ['Irmak', 'İ'], ['Irmak', 'ı'],
  ];
  for (const [word, typed] of cases) {
    const game = timeTest([word], 'tr');
    game.type(typed, 0);
    const result = finish15(game);
    assert.equal(result.errors, 1, `"${typed}" for "${word[0]}"`);
    assert.equal(result.accuracy, 0);
  }
});

test('Turkish: words typed exactly with ç ğ ı İ ö ş ü are correct', () => {
  const words = ['ılık', 'için', 'İnce', 'Irmak', 'çiçek', 'ağaç', 'göz', 'şeker', 'üzüm'];
  const game = timeTest(words, 'tr');
  play(game, words.join(' '), 0, 100);
  const result = finish15(game);
  assert.equal(result.errors, 0);
  assert.equal(result.accuracy, 100);
  assert.deepEqual(result.chars, { correct: words.join('').length, incorrect: 0, extra: 0, missed: 0 });
});

test('Turkish: a word typed with i instead of ı is wrong and earns no WPM', () => {
  const game = timeTest(['ılık', 'için', 'ışık'], 'tr');
  play(game, 'ilık için ışık', 0, 100);
  const result = finish15(game);
  assert.equal(result.errors, 1);
  assert.deepEqual(result.chars, { correct: 11, incorrect: 1, extra: 0, missed: 0 });
  assert.equal(result.wpm, 7.2); // "için " + "ışık" = 9 characters; "ilık" earns nothing
});

test('decomposed input is normalized: s + combining cedilla types ş', () => {
  const game = timeTest(['şeker'], 'tr');
  game.type('s\u0327eker', 0);
  assert.deepEqual(game.getState().inputs, ['şeker']);
  assert.equal(finish15(game).errors, 0);
});

test('control characters and emoji are ignored; a no-break space works as Space', () => {
  const game = timeTest(['cat', 'dog']);
  game.type('\tc\na\u200bt\u{1F600}', 0);
  assert.deepEqual(game.getState().inputs, ['cat']);
  game.type('\u00a0', 100);
  assert.equal(game.getState().wordIndex, 1);
  game.type(null, 200);
  assert.deepEqual(game.getState().inputs, ['cat', '']);
});

test('a words test ends on the last letter of a correct last word', () => {
  const game = wordsTest(['ab']);
  play(game, Array(10).fill('ab').join(' ').slice(0, -1), 0, 100);
  assert.equal(game.getState().status, 'running');
  assert.equal(game.getState().wordsDone, 9);
  game.type('b', 5_000);
  const state = game.getState();
  assert.equal(state.status, 'finished');
  assert.equal(state.wordsDone, 10);
  game.type('z', 5_100);
  assert.equal(game.getState().inputs[9], 'ab');
});

test('a words test with a wrong last word ends when Space commits it', () => {
  const game = wordsTest(['ab']);
  play(game, `${Array(9).fill('ab').join(' ')} ax`, 0, 100);
  assert.equal(game.getState().status, 'running');
  game.type(' ', 5_000);
  const state = game.getState();
  assert.equal(state.status, 'finished');
  assert.equal(state.wordIndex, 10);
  assert.equal(state.wordsDone, 10);
  assert.deepEqual(state.result.chars, { correct: 19, incorrect: 1, extra: 0, missed: 0 });
});

test('a words test counts committed words and has no remaining time', () => {
  const game = createGame({ mode: 'words', amount: 25, nextWord: wordsFrom(['ab']) });
  play(game, 'ab ab a', 0, 100);
  const state = game.getState();
  assert.equal(state.wordsDone, 2);
  assert.equal(state.remainingMs, null);
  assert.equal(state.words.length, 25);
});

test('history: one sample per second of a time test with net WPM, raw WPM and errors', () => {
  const game = timeTest(['one', 'two']);
  play(game, 'one tx', 0, 150); // 6 keys within the first second; "x" is wrong
  const result = finish15(game);
  const { history } = result;
  assert.deepEqual(history.map((sample) => sample.second), Array.from({ length: 15 }, (_, i) => i + 1));
  assert.deepEqual(history[0], { second: 1, wpm: 48, raw: 72, errors: 1 });
  assert.ok(history.slice(1).every((sample) => sample.raw === 0 && sample.errors === 0));
  assert.equal(history[14].wpm, 3.2);
  assert.equal(result.consistency, consistency(history.map((sample) => sample.raw)));
});

test('history: a words test adds its last partial second when it lasts at least half a second', () => {
  const game = wordsTest(['ab']);
  play(game, Array(10).fill('ab').join(' '), 0, 200); // 29 keys, the last at 5.6 s
  const { result } = game.getState();
  assert.equal(result.durationMs, 5_600);
  assert.deepEqual(result.history.map((sample) => sample.second), [1, 2, 3, 4, 5, 5.6]);
  assert.equal(result.history[5].raw, 80); // 4 keys in 0.6 s
  assert.equal(result.history[5].wpm, result.wpm);
});

test('history: a last partial second shorter than half a second is left out', () => {
  const game = wordsTest(['ab']);
  play(game, Array(10).fill('ab').join(' '), 0, 150); // the last key at 4.2 s
  const { result } = game.getState();
  assert.equal(result.durationMs, 4_200);
  assert.deepEqual(result.history.map((sample) => sample.second), [1, 2, 3, 4]);
});

test('a time test keeps adding words ahead of the current one', () => {
  const game = createGame({ mode: 'time', amount: 60, nextWord: wordsFrom(['a']) });
  play(game, 'a '.repeat(200), 0, 20);
  const state = game.getState();
  assert.equal(state.wordIndex, 200);
  assert.ok(state.words.length > state.wordIndex + 30);
  assert.equal(state.inputs.length, state.wordIndex + 1);
});

test('a words test has exactly the chosen number of words', () => {
  for (const amount of MODE_OPTIONS.words) {
    assert.equal(createGame({ mode: 'words', amount, seed: 3 }).getState().words.length, amount);
  }
});

test('the same seed gives the same words, another seed other words', () => {
  const wordsOf = (seed, lang) => createGame({ mode: 'words', amount: 50, lang, seed }).getState().words;
  assert.deepEqual(wordsOf(42, 'en'), wordsOf(42, 'en'));
  assert.deepEqual(wordsOf(42, 'tr'), wordsOf(42, 'tr'));
  assert.notDeepEqual(wordsOf(42, 'en'), wordsOf(43, 'en'));
});

test('the word list language decides where the words come from', () => {
  const wordsOf = (lang) => createGame({ mode: 'words', amount: 50, lang, seed: 5 }).getState().words;
  assert.ok(wordsOf('en').every((word) => WORD_LISTS.en.includes(word)));
  assert.ok(wordsOf('tr').every((word) => WORD_LISTS.tr.includes(word)));
});

test('invalid options fall back to a 30-second English time test', () => {
  const { mode, amount, lang } = createGame({ mode: 'race', amount: 7, lang: 'xx' }).getState();
  assert.deepEqual({ mode, amount, lang }, { mode: 'time', amount: 30, lang: 'en' });
});

test('getState returns copies and a frozen result', () => {
  const game = timeTest(['cat']);
  play(game, 'ca');
  const state = game.getState();
  const wordCount = state.words.length;
  state.words.push('extra');
  state.inputs[0] = 'zzz';
  assert.equal(game.getState().words.length, wordCount);
  assert.deepEqual(game.getState().inputs, ['ca']);
  const result = finish15(game);
  assert.ok(Object.isFrozen(result));
  assert.ok(Object.isFrozen(result.history));
  assert.ok(Object.isFrozen(result.history[0]));
});
