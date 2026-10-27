import { createWordGenerator } from './generator.js';
import { accuracy, consistency, wordsPerMinute } from './metrics.js';
import { createRng } from './rng.js';
import { normalizeSettings } from './settings.js';
import { countChars, countNetChars, isCorrectKeystroke, isWordCorrect } from './typing.js';
import { WORD_LISTS } from './wordlists.js';

/** Letters that can be typed past the end of a word; further letters are ignored. */
export const MAX_EXTRA_CHARS = 10;

/** Words kept ready after the current one in time mode. */
const WORDS_AHEAD = 40;
/** A last partial second shorter than this stays out of the per-second history. */
const MIN_PARTIAL_SECOND_MS = 500;
/** Characters treated as Space; some mobile keyboards send a no-break space. */
const SPACES = new Set([' ', '\u00a0']);
/** Control, format and other invisible characters are ignored. */
const INVISIBLE = /\p{C}/u;
const EMPTY_BUCKET = Object.freeze({ keys: 0, errors: 0 });

/**
 * @typedef {object} Sample - one point of the per-second history
 * @property {number} second - end of the interval in seconds since the first keystroke
 * @property {number} wpm - net WPM from the start up to this moment
 * @property {number} raw - raw WPM of the keystrokes inside the interval
 * @property {number} errors - incorrect keystrokes inside the interval
 */

/**
 * @typedef {object} Result
 * @property {'time' | 'words'} mode
 * @property {number} amount
 * @property {'en' | 'tr'} lang
 * @property {number} durationMs
 * @property {number} wpm - (letters of correct words + the Spaces after them) / 5 per minute
 * @property {number} raw - every typed character, mistakes and deleted ones included, / 5 per minute
 * @property {number} accuracy - correct keystrokes in percent
 * @property {number} consistency - 0-100, from the raw WPM of each second
 * @property {number} errors - incorrect keystrokes, corrected ones included
 * @property {import('./typing.js').CharCounts} chars - letters of the final text
 * @property {readonly Sample[]} history - one sample per second
 */

/**
 * @typedef {object} GameState
 * @property {'time' | 'words'} mode
 * @property {number} amount
 * @property {'en' | 'tr'} lang
 * @property {'ready' | 'running' | 'finished'} status
 * @property {string[]} words - target words; time mode adds more as the test goes on
 * @property {string[]} inputs - typed text per word, from the first word to the current one
 * @property {number} wordIndex - current word; equals words.length after the last word was committed
 * @property {number} elapsedMs
 * @property {number | null} remainingMs - time left in time mode, null in words mode
 * @property {number} wordsDone - committed words; every word once a words test is finished
 * @property {Result | null} result - frozen result once the test is finished
 */

/**
 * @typedef {object} Game
 * @property {(text: string, now: number) => void} type - types each character; " " commits the word
 * @property {(now: number) => void} backspace - deletes one character, see createGame
 * @property {(now: number) => void} update - moves the clock; call it every frame
 * @property {() => GameState} getState - snapshot for rendering
 */

/**
 * Creates a typing test. The clock starts with the first typed letter and
 * every method takes `now`, a timestamp in milliseconds (e.g. performance.now()).
 * Space commits the current word and skips its untyped letters; Space on an
 * empty word is ignored. Backspace deletes within the current word and, on an
 * empty word, returns to the previous word only if that word has errors.
 * A time test ends when its time is up, a words test when the last word is
 * typed correctly or committed with Space.
 * @param {object} [options]
 * @param {'time' | 'words'} [options.mode] - default "time"
 * @param {number} [options.amount] - 15, 30 or 60 seconds; 10, 25 or 50 words
 * @param {'en' | 'tr'} [options.lang] - word list language, default "en"
 * @param {number} [options.seed] - seed of the word sequence, default 1
 * @param {() => string} [options.nextWord] - custom word source instead of the seeded word list
 * @returns {Game}
 */
export function createGame(options = {}) {
  const settings = normalizeSettings(options);
  const run = {
    settings,
    nextWord: options.nextWord ?? seededWords(settings.lang, options.seed ?? 1),
    words: [],
    inputs: [''],
    wordIndex: 0,
    startMs: null,
    nowMs: 0,
    endMs: null,
    correctKeys: 0,
    incorrectKeys: 0,
    buckets: [], // keystrokes and errors in each second of the test
    history: [],
    result: null,
  };
  addWords(run);
  return {
    type: (text, now) => typeText(run, text, now),
    backspace: (now) => deleteBack(run, now),
    update: (now) => {
      advanceClock(run, now);
    },
    getState: () => snapshot(run),
  };
}

function seededWords(lang, seed) {
  return createWordGenerator(WORD_LISTS[lang], createRng(seed));
}

/** Fills the word buffer: every word in words mode, WORDS_AHEAD past the current word in time mode. */
function addWords(run) {
  const { mode, amount } = run.settings;
  const wanted = mode === 'words' ? amount : run.wordIndex + 1 + WORDS_AHEAD;
  while (run.words.length < wanted) run.words.push(run.nextWord());
}

function timeLimitMs(settings) {
  return settings.mode === 'time' ? settings.amount * 1000 : Infinity;
}

function typeText(run, text, now) {
  if (typeof text !== 'string') return;
  for (const char of text.normalize('NFC')) {
    if (SPACES.has(char)) typeSpace(run, now);
    else if (char.length === 1 && !INVISIBLE.test(char)) typeLetter(run, char, now);
  }
}

function typeLetter(run, char, now) {
  if (run.startMs === null) {
    run.startMs = now;
    run.nowMs = now;
  }
  if (!advanceClock(run, now)) return;
  const target = run.words[run.wordIndex];
  const input = run.inputs[run.wordIndex];
  if (input.length >= target.length + MAX_EXTRA_CHARS) return;
  countKeystroke(run, isCorrectKeystroke(target, input, char));
  run.inputs[run.wordIndex] = input + char;
  if (isLastWordDone(run)) finish(run, run.nowMs);
}

function typeSpace(run, now) {
  if (!advanceClock(run, now)) return;
  const input = run.inputs[run.wordIndex];
  if (input === '') return;
  // Space is the right key only once every letter of the word was typed.
  countKeystroke(run, input.length >= run.words[run.wordIndex].length);
  run.wordIndex += 1;
  addWords(run);
  if (run.wordIndex < run.words.length) run.inputs.push('');
  else finish(run, run.nowMs);
}

function deleteBack(run, now) {
  if (!advanceClock(run, now)) return;
  const input = run.inputs[run.wordIndex];
  if (input !== '') {
    run.inputs[run.wordIndex] = input.slice(0, -1);
  } else if (canReturnToPreviousWord(run)) {
    run.inputs.pop();
    run.wordIndex -= 1;
  }
}

/** Backspace may go back into the previous word only when that word has errors. */
function canReturnToPreviousWord(run) {
  const previous = run.wordIndex - 1;
  return previous >= 0 && !isWordCorrect(run.words[previous], run.inputs[previous]);
}

function isLastWordDone(run) {
  const last = run.words.length - 1;
  if (run.settings.mode !== 'words' || run.wordIndex !== last) return false;
  return isWordCorrect(run.words[last], run.inputs[last]);
}

/**
 * Moves the clock to `now`, adds history samples for finished seconds and ends
 * a time test whose time is up. Returns true while the test accepts input.
 */
function advanceClock(run, now) {
  if (run.result !== null) return false;
  if (run.startMs === null) return true;
  run.nowMs = Math.max(run.nowMs, now);
  const limitMs = timeLimitMs(run.settings);
  const elapsedMs = run.nowMs - run.startMs;
  closeSeconds(run, Math.min(elapsedMs, limitMs));
  if (elapsedMs < limitMs) return true;
  finish(run, run.startMs + limitMs);
  return false;
}

function countKeystroke(run, correct) {
  const index = Math.floor((run.nowMs - run.startMs) / 1000);
  const bucket = (run.buckets[index] ??= { keys: 0, errors: 0 });
  bucket.keys += 1;
  if (correct) {
    run.correctKeys += 1;
  } else {
    run.incorrectKeys += 1;
    bucket.errors += 1;
  }
}

/** Adds a history sample for every whole second up to `elapsedMs`. */
function closeSeconds(run, elapsedMs) {
  while ((run.history.length + 1) * 1000 <= elapsedMs) {
    const index = run.history.length;
    addSample(run, index, (index + 1) * 1000, 1000);
  }
}

function addSample(run, index, atMs, spanMs) {
  const bucket = run.buckets[index] ?? EMPTY_BUCKET;
  run.history.push(Object.freeze({
    second: atMs / 1000,
    wpm: wordsPerMinute(netChars(run), atMs),
    raw: wordsPerMinute(bucket.keys, spanMs),
    errors: bucket.errors,
  }));
}

function finish(run, endMs) {
  run.endMs = endMs;
  const durationMs = endMs - run.startMs;
  const partialMs = durationMs - run.history.length * 1000;
  if (partialMs >= MIN_PARTIAL_SECOND_MS) addSample(run, run.history.length, durationMs, partialMs);
  run.result = buildResult(run, durationMs);
}

function buildResult(run, durationMs) {
  const typed = run.correctKeys + run.incorrectKeys;
  return Object.freeze({
    ...run.settings,
    durationMs,
    wpm: wordsPerMinute(netChars(run), durationMs),
    raw: wordsPerMinute(typed, durationMs),
    accuracy: accuracy(run.correctKeys, typed),
    consistency: consistency(run.history.map((sample) => sample.raw)),
    errors: run.incorrectKeys,
    chars: Object.freeze(countChars(run.words, run.inputs, run.wordIndex)),
    history: Object.freeze([...run.history]),
  });
}

function netChars(run) {
  return countNetChars(run.words, run.inputs, run.wordIndex);
}

function statusOf(run) {
  if (run.result !== null) return 'finished';
  return run.startMs === null ? 'ready' : 'running';
}

function snapshot(run) {
  const { settings, result } = run;
  const elapsedMs = run.startMs === null ? 0 : (run.endMs ?? run.nowMs) - run.startMs;
  return {
    ...settings,
    status: statusOf(run),
    words: [...run.words],
    inputs: [...run.inputs],
    wordIndex: run.wordIndex,
    elapsedMs,
    remainingMs: settings.mode === 'time' ? Math.max(0, timeLimitMs(settings) - elapsedMs) : null,
    wordsDone: result !== null && settings.mode === 'words' ? settings.amount : run.wordIndex,
    result,
  };
}
