import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FIELD_PREFIX, applyEdit, diffText, isProvisional } from '../src/field-edit.js';
import { createGame } from '../src/game.js';

/** A 10-word test over a fixed word list, repeated. */
function wordsGame(list) {
  let next = 0;
  return createGame({ mode: 'words', amount: 10, nextWord: () => list[next++ % list.length] });
}

/**
 * Plays a hidden text field the way the page does: the field shows
 * FIELD_PREFIX plus the current word, and every new value is applied as an edit.
 */
function fieldFor(game) {
  let now = 1000;
  const value = () => {
    const { inputs, wordIndex } = game.getState();
    return FIELD_PREFIX + (inputs[wordIndex] ?? '');
  };
  return {
    value,
    change(next) {
      now += 150;
      applyEdit(game, diffText(value(), next), now);
    },
  };
}

test('diffText reads added letters as typed text', () => {
  assert.deepEqual(diffText(' ab', ' abc'), { deleted: 0, inserted: 'c' });
  assert.deepEqual(diffText(' ', ' cat '), { deleted: 0, inserted: 'cat ' });
});

test('diffText reads removed letters as Backspaces', () => {
  assert.deepEqual(diffText(' abc', ' ab'), { deleted: 1, inserted: '' });
  assert.deepEqual(diffText(' ', ''), { deleted: 1, inserted: '' });
});

test('diffText reads a replaced word as Backspaces followed by the new text', () => {
  assert.deepEqual(diffText(' teh', ' the '), { deleted: 2, inserted: 'he ' });
  assert.deepEqual(diffText(' ıi', ' ii'), { deleted: 2, inserted: 'ii' });
});

test('diffText finds no change in equal values', () => {
  assert.deepEqual(diffText(' ab', ' ab'), { deleted: 0, inserted: '' });
  assert.deepEqual(diffText('', ''), { deleted: 0, inserted: '' });
});

test('isProvisional holds back a dead-key accent until the composition ends', () => {
  assert.equal(isProvisional('´', true), true);
  assert.equal(isProvisional('¨', true), true);
  assert.equal(isProvisional('^', true), true);
  assert.equal(isProvisional('´', false), false);
});

test('isProvisional lets letters composed by an on-screen keyboard through', () => {
  assert.equal(isProvisional('é', true), false);
  assert.equal(isProvisional('ş', true), false);
  assert.equal(isProvisional('e\u0301', true), false);
  assert.equal(isProvisional('kelime', true), false);
});

test('applyEdit applies Backspaces before the typed text', () => {
  const game = wordsGame(['the', 'cat']);
  applyEdit(game, { deleted: 0, inserted: 'tx' }, 1000);
  applyEdit(game, { deleted: 1, inserted: 'he' }, 1200);
  const state = game.getState();
  assert.deepEqual(state.inputs, ['the']);
  assert.equal(state.status, 'running');
});

test('applyEdit with an empty edit leaves the test untouched', () => {
  const game = wordsGame(['the', 'cat']);
  applyEdit(game, { deleted: 0, inserted: '' }, 1000);
  const state = game.getState();
  assert.equal(state.status, 'ready');
  assert.deepEqual(state.inputs, ['']);
});

test('typing through the field commits words with Space', () => {
  const game = wordsGame(['the', 'cat']);
  const field = fieldFor(game);
  for (const value of [' t', ' th', ' the', ' the ', ' c', ' ca', ' cat', ' cat ']) field.change(value);
  const state = game.getState();
  assert.deepEqual(state.inputs.slice(0, 2), ['the', 'cat']);
  assert.equal(state.wordIndex, 2);
  assert.equal(field.value(), FIELD_PREFIX);
});

test('deleting the field prefix is Backspace on an empty word', () => {
  const game = wordsGame(['the', 'cat']);
  const field = fieldFor(game);
  field.change(' tha');
  field.change(' tha ');
  assert.equal(game.getState().wordIndex, 1);
  field.change('');
  assert.equal(game.getState().wordIndex, 0);
  assert.equal(field.value(), ' tha');
});

test('an on-screen keyboard that corrects a word is applied as Backspaces plus text', () => {
  const game = wordsGame(['the', 'cat']);
  const field = fieldFor(game);
  field.change(' teh');
  field.change(' the ');
  const state = game.getState();
  assert.equal(state.inputs[0], 'the');
  assert.equal(state.wordIndex, 1);
});

test('words picked from a suggestion strip are typed in one edit each', () => {
  const game = wordsGame(['the', 'cat']);
  const field = fieldFor(game);
  for (let i = 0; i < 9; i += 1) field.change(` ${i % 2 === 0 ? 'the' : 'cat'} `);
  assert.equal(game.getState().wordIndex, 9);
  field.change(' cat');
  const state = game.getState();
  assert.equal(state.status, 'finished');
  assert.equal(state.result.chars.correct, 30);
  assert.equal(state.result.errors, 0);
});
