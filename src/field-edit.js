/**
 * Pure helpers that turn changes of the hidden text field into keystrokes.
 * Reading the field's value (instead of key codes) works with desktop
 * keyboards and with on-screen keyboards that compose whole words.
 */

/**
 * The field always holds this prefix plus the current word. On-screen
 * keyboards send nothing for Backspace in an empty field, so the field is
 * never empty: deleting the prefix means Backspace on an empty word.
 */
export const FIELD_PREFIX = ' ';

/** @typedef {{deleted: number, inserted: string}} FieldEdit */

/**
 * Describes how a text field changed as a number of Backspaces followed by
 * typed text, comparing the old and the new value from the start.
 * @param {string} before - value the field had
 * @param {string} after - value the field has now
 * @returns {FieldEdit}
 */
export function diffText(before, after) {
  const limit = Math.min(before.length, after.length);
  let common = 0;
  while (common < limit && before[common] === after[common]) common += 1;
  return { deleted: before.length - common, inserted: after.slice(common) };
}

/**
 * Tells whether text typed during an IME composition is still provisional.
 * A dead key shows a lone accent such as ´ or ¨ until the next key turns it
 * into a letter, so such text waits for the composition to finish.
 * Letters typed while an on-screen keyboard composes a word count right away.
 * @param {string} inserted - text added since the last processed value
 * @param {boolean} composing - true while an IME composition is active
 * @returns {boolean}
 */
export function isProvisional(inserted, composing) {
  return composing && /[^\p{L}\p{M}]/u.test(inserted);
}

/**
 * Applies a field edit to a game: its Backspaces first, then its typed text,
 * all at the same moment.
 * @param {import('./game.js').Game} game
 * @param {FieldEdit} edit
 * @param {number} now - timestamp in milliseconds
 */
export function applyEdit(game, edit, now) {
  for (let i = 0; i < edit.deleted; i += 1) game.backspace(now);
  if (edit.inserted !== '') game.type(edit.inserted, now);
}
