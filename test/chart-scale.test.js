import { test } from 'node:test';
import assert from 'node:assert/strict';
import { timeLabelStep, valueAxis } from '../src/chart-scale.js';

test('valueAxis rounds the top of the chart up to a round number in four steps', () => {
  assert.deepEqual(valueAxis(87), { max: 100, step: 25 });
  assert.deepEqual(valueAxis(101), { max: 120, step: 30 });
  assert.deepEqual(valueAxis(140), { max: 160, step: 40 });
});

test('valueAxis keeps a readable scale for slow or empty tests', () => {
  assert.deepEqual(valueAxis(0), { max: 20, step: 5 });
  assert.deepEqual(valueAxis(-3), { max: 20, step: 5 });
  assert.deepEqual(valueAxis(Number.NaN), { max: 20, step: 5 });
});

test('valueAxis takes another number of steps', () => {
  assert.deepEqual(valueAxis(87, 5), { max: 100, step: 20 });
});

test('valueAxis always leaves room above the highest value without wasting space', () => {
  for (let value = 0; value <= 400; value += 0.5) {
    const { max, step } = valueAxis(value);
    const top = Math.max(value * 1.05, 20);
    assert.equal(max, step * 4);
    assert.ok(max >= top - 1e-9, `max ${max} below ${top}`);
    assert.ok(max <= top * 1.5 + 1e-9, `max ${max} too far above ${top}`);
  }
});

test('timeLabelStep keeps neighbouring time labels apart', () => {
  assert.equal(timeLabelStep(15, 600), 1);
  assert.equal(timeLabelStep(30, 600), 2);
  assert.equal(timeLabelStep(30, 300), 5);
  assert.equal(timeLabelStep(60, 300), 10);
  assert.equal(timeLabelStep(30, 300, 100), 10);
});

test('timeLabelStep falls back to sensible steps for odd input', () => {
  assert.equal(timeLabelStep(0, 300), 1);
  assert.equal(timeLabelStep(30, 0), 1);
  assert.equal(timeLabelStep(Number.NaN, 300), 1);
  assert.equal(timeLabelStep(100_000, 100), 300);
});
