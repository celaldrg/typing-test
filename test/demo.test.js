import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createDemoGame } from '../src/demo.js';

test('the demo is a finished 30-second English time test', () => {
  const { status, mode, amount, lang, result } = createDemoGame().getState();
  assert.equal(status, 'finished');
  assert.deepEqual({ mode, amount, lang }, { mode: 'time', amount: 30, lang: 'en' });
  assert.equal(result.durationMs, 30_000);
  assert.equal(result.history.length, 30);
});

test('the demo is the same every time', () => {
  assert.deepEqual(createDemoGame().getState(), createDemoGame().getState());
});

test('the demo shows believable results with a few errors', () => {
  const { result } = createDemoGame().getState();
  assert.ok(result.wpm >= 60 && result.wpm <= 90, `wpm ${result.wpm}`);
  assert.ok(result.raw >= result.wpm, `raw ${result.raw}`);
  assert.ok(result.accuracy >= 90 && result.accuracy < 100, `accuracy ${result.accuracy}`);
  assert.ok(result.consistency >= 70 && result.consistency <= 95, `consistency ${result.consistency}`);
  assert.ok(result.errors > 0);
});
