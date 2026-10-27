import { test } from 'node:test';
import assert from 'node:assert/strict';
import { classifyWord, countChars, countNetChars, isCorrectKeystroke, isWordCorrect } from '../src/typing.js';

test('classifyWord marks correct, incorrect, pending, missed and extra letters', () => {
  assert.deepEqual(classifyWord('cat', 'cut', false), ['correct', 'incorrect', 'correct']);
  assert.deepEqual(classifyWord('cat', 'ca', false), ['correct', 'correct', 'pending']);
  assert.deepEqual(classifyWord('cat', 'ca', true), ['correct', 'correct', 'missed']);
  assert.deepEqual(classifyWord('cat', 'catss', false), ['correct', 'correct', 'correct', 'extra', 'extra']);
  assert.deepEqual(classifyWord('cat', '', false), ['pending', 'pending', 'pending']);
});

test('comparison is case-sensitive', () => {
  assert.deepEqual(classifyWord('the', 'The', false), ['incorrect', 'correct', 'correct']);
  assert.equal(isWordCorrect('the', 'The'), false);
  assert.equal(isCorrectKeystroke('the', '', 'T'), false);
});

test('Turkish: dotted i and dotless ı are different letters, in both cases', () => {
  assert.deepEqual(classifyWord('ılık', 'ilık', false), ['incorrect', 'correct', 'correct', 'correct']);
  assert.deepEqual(classifyWord('için', 'ıçin', false), ['incorrect', 'correct', 'correct', 'correct']);
  assert.deepEqual(classifyWord('İnce', 'Ince', false), ['incorrect', 'correct', 'correct', 'correct']);
  assert.equal(isCorrectKeystroke('ışık', '', 'i'), false);
  assert.equal(isCorrectKeystroke('ışık', '', 'I'), false);
  assert.equal(isCorrectKeystroke('ışık', '', 'ı'), true);
  assert.equal(isCorrectKeystroke('İnce', '', 'I'), false);
  assert.equal(isCorrectKeystroke('İnce', '', 'i'), false);
  assert.equal(isCorrectKeystroke('İnce', '', 'İ'), true);
  assert.equal(isCorrectKeystroke('ilk', '', 'İ'), false);
});

test('Turkish: words match only when every letter is exactly the same', () => {
  assert.equal(isWordCorrect('ılık', 'ılık'), true);
  assert.equal(isWordCorrect('ılık', 'ilik'), false);
  assert.equal(isWordCorrect('şeker', 'seker'), false);
  assert.equal(isWordCorrect('göz', 'goz'), false);
  assert.equal(isWordCorrect('ağaç', 'agac'), false);
  assert.equal(isWordCorrect('üzüm', 'uzum'), false);
});

test('isCorrectKeystroke is false for letters past the end of the word', () => {
  assert.equal(isCorrectKeystroke('at', 'at', 't'), false);
  assert.equal(isCorrectKeystroke('at', 'a', 't'), true);
});

test('countNetChars counts correct words with their Space and the error-free start of the current word', () => {
  const words = ['one', 'two', 'six', 'ten'];
  assert.equal(countNetChars(words, ['one', 'twx', 'si'], 2), 6);
  assert.equal(countNetChars(words, ['one', 'twx', 'sx'], 2), 4);
  assert.equal(countNetChars(words, ['one', 'two', 'six'], 2), 11);
  assert.equal(countNetChars(words, ['one', 'two', 'six', 'ten'], 4), 16);
  assert.equal(countNetChars(words, ['ones', ''], 1), 0);
});

test('countChars totals the letters of reached words and skips pending ones', () => {
  const words = ['one', 'two', 'six'];
  assert.deepEqual(countChars(words, ['one', 'tw', 'sixx'], 2), { correct: 8, incorrect: 0, extra: 1, missed: 1 });
  assert.deepEqual(countChars(words, ['ona', 'tw'], 1), { correct: 4, incorrect: 1, extra: 0, missed: 0 });
});
