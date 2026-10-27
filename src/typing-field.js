import { FIELD_PREFIX, diffText, isProvisional } from './field-edit.js';

/** Keys that would move the field's caret away from the end. */
const CARET_KEYS = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown']);

/**
 * @typedef {object} FieldHandlers
 * @property {() => string} currentInput - text typed so far for the current word
 * @property {(edit: import('./field-edit.js').FieldEdit) => void} edit - applies Backspaces, then typed text
 * @property {() => void} tab - Tab was pressed in the field
 */

/**
 * @typedef {object} TypingField
 * @property {() => void} sync - makes the field show the current word again
 * @property {() => void} focus
 * @property {() => void} blur - also hides an on-screen keyboard
 */

/**
 * Connects the hidden text field to the test. The field holds FIELD_PREFIX
 * plus the current word, so every change, from a desktop key or from an
 * on-screen keyboard that composes whole words, can be read back as
 * Backspaces and typed text. Paste, cut and drop are blocked.
 * @param {HTMLInputElement} field
 * @param {FieldHandlers} handlers
 * @returns {TypingField}
 */
export function createTypingField(field, handlers) {
  const expectedValue = () => FIELD_PREFIX + handlers.currentInput();

  function sync() {
    const value = expectedValue();
    if (field.value !== value) field.value = value;
  }

  function apply(composing) {
    const edit = diffText(expectedValue(), field.value);
    if ((edit.deleted === 0 && edit.inserted === '') || isProvisional(edit.inserted, composing)) return;
    handlers.edit(edit);
    sync();
  }

  function moveCaretToEnd() {
    const end = field.value.length;
    if (field.selectionStart !== end || field.selectionEnd !== end) field.setSelectionRange(end, end);
  }

  function onKeyDown(event) {
    if (event.key === 'Tab' && !event.shiftKey) {
      event.preventDefault();
      handlers.tab();
    } else if (CARET_KEYS.has(event.key) || isSelectAll(event)) {
      event.preventDefault();
    } else if (!event.isComposing && event.key !== 'Process' && event.key !== 'Unidentified') {
      moveCaretToEnd();
    }
  }

  field.addEventListener('input', (event) => apply(event.isComposing));
  field.addEventListener('compositionend', () => apply(false));
  field.addEventListener('keydown', onKeyDown);
  field.addEventListener('focus', moveCaretToEnd);
  field.addEventListener('click', moveCaretToEnd);
  for (const type of ['paste', 'cut', 'drop']) {
    field.addEventListener(type, (event) => event.preventDefault());
  }

  return {
    sync,
    focus: () => field.focus(),
    blur: () => field.blur(),
  };
}

function isSelectAll(event) {
  return (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'a';
}
