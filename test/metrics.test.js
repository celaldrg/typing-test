import { test } from 'node:test';
import assert from 'node:assert/strict';
import { accuracy, consistency, wordsPerMinute } from '../src/metrics.js';

test('wordsPerMinute is (characters / 5) per minute', () => {
  assert.equal(wordsPerMinute(50, 60_000), 10);
  assert.equal(wordsPerMinute(60, 12_000), 60);
  assert.equal(wordsPerMinute(49, 12_000), 49);
  assert.equal(wordsPerMinute(11, 15_000), 8.8);
});

test('wordsPerMinute is 0 without characters or time', () => {
  assert.equal(wordsPerMinute(0, 5_000), 0);
  assert.equal(wordsPerMinute(10, 0), 0);
});

test('accuracy is the share of correct keystrokes in percent', () => {
  assert.equal(accuracy(45, 50), 90);
  assert.equal(accuracy(38, 40), 95);
  assert.equal(accuracy(7, 7), 100);
  assert.equal(accuracy(0, 3), 0);
});

test('accuracy is 0 when nothing was typed', () => {
  assert.equal(accuracy(0, 0), 0);
});

test('consistency is 100 for equal samples and drops as samples spread', () => {
  assert.equal(consistency([60, 60, 60]), 100);
  const close = consistency([58, 60, 62]);
  const spread = consistency([30, 60, 90]);
  assert.ok(close < 100);
  assert.ok(spread < close);
});

test('consistency maps the coefficient of variation through 100 * (1 - tanh(cv))', () => {
  // mean 75, standard deviation 25, cv = 1/3
  assert.ok(Math.abs(consistency([50, 100]) - 100 * (1 - Math.tanh(1 / 3))) < 1e-9);
});

test('consistency is 0 without samples or without speed', () => {
  assert.equal(consistency([]), 0);
  assert.equal(consistency([0, 0, 0]), 0);
});
