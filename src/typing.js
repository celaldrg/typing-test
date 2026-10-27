/**
 * Pure helpers that compare typed text with the target words.
 * Every comparison is exact and case-sensitive, character by character, with
 * no locale rules: "ı" and "i" are different letters, and so are "İ" and "I".
 */

/** @typedef {'correct' | 'incorrect' | 'extra' | 'missed' | 'pending'} CharState */
/** @typedef {{correct: number, incorrect: number, extra: number, missed: number}} CharCounts */

/**
 * Classifies every character of a word for display: one state per target
 * letter, followed by one "extra" state per letter typed past the end.
 * @param {string} target - the word to type
 * @param {string} input - what was typed for this word
 * @param {boolean} committed - true once the word was left with Space; its
 *   untyped letters are then "missed" instead of "pending"
 * @returns {CharState[]}
 */
export function classifyWord(target, input, committed) {
  const states = [];
  for (let i = 0; i < target.length; i += 1) {
    if (i < input.length) states.push(input[i] === target[i] ? 'correct' : 'incorrect');
    else states.push(committed ? 'missed' : 'pending');
  }
  for (let i = target.length; i < input.length; i += 1) states.push('extra');
  return states;
}

/**
 * Tells whether typing `char` after `input` hits the next letter of `target`.
 * A letter typed past the end of the word is never correct.
 * @param {string} target
 * @param {string} input - text typed so far for this word
 * @param {string} char - the typed character
 * @returns {boolean}
 */
export function isCorrectKeystroke(target, input, char) {
  return input.length < target.length && target[input.length] === char;
}

/**
 * Tells whether a word was typed exactly right.
 * @param {string} target
 * @param {string} input
 * @returns {boolean}
 */
export function isWordCorrect(target, input) {
  return input === target;
}

/**
 * Counts the characters behind net WPM: the letters of every committed word
 * typed exactly right plus the Space that committed it, and the letters of the
 * current word while they are still free of errors.
 * @param {readonly string[]} words - target words
 * @param {readonly string[]} inputs - typed text per word, from the first word to the current one
 * @param {number} wordIndex - current word; equals words.length once every word is committed
 * @returns {number}
 */
export function countNetChars(words, inputs, wordIndex) {
  let total = 0;
  for (let i = 0; i < wordIndex; i += 1) {
    if (isWordCorrect(words[i], inputs[i])) total += words[i].length + 1;
  }
  const current = inputs[wordIndex];
  if (current !== undefined && words[wordIndex].startsWith(current)) total += current.length;
  return total;
}

/**
 * Totals the character states of every word reached so far. The untyped
 * ("pending") letters of the current word are not counted.
 * @param {readonly string[]} words
 * @param {readonly string[]} inputs
 * @param {number} wordIndex
 * @returns {CharCounts}
 */
export function countChars(words, inputs, wordIndex) {
  const totals = { correct: 0, incorrect: 0, extra: 0, missed: 0 };
  inputs.forEach((input, i) => {
    for (const state of classifyWord(words[i], input, i < wordIndex)) {
      if (state !== 'pending') totals[state] += 1;
    }
  });
  return totals;
}
