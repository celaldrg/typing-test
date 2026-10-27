import { makeElement } from './dom.js';
import { classifyWord, isWordCorrect } from './typing.js';

/**
 * @typedef {object} WordsView
 * @property {(state: import('./game.js').GameState) => void} render - draws the words of a game state
 * @property {() => void} reset - removes every word, before a new test
 * @property {() => void} relayout - moves the caret and the lines again, e.g. after a resize
 */

/**
 * Shows the words of a test: one span per letter coloured by its state, three
 * visible lines that scroll as the typist moves on, and a caret that glides to
 * the next letter. Only words whose text changed are drawn again.
 * @param {HTMLElement} viewport - element that is three lines tall and hides the rest
 * @returns {WordsView}
 */
export function createWordsView(viewport) {
  const track = makeElement('div', 'words__track');
  const caret = makeElement('div', 'caret');
  caret.setAttribute('aria-hidden', 'true');
  track.append(caret);
  viewport.replaceChildren(track);
  let wordNodes = [];
  let drawn = []; // what each word node shows: committed flag + typed text
  let state = null;

  function reset() {
    wordNodes.forEach((node) => node.remove());
    wordNodes = [];
    drawn = [];
    state = null;
  }

  function render(next) {
    state = next;
    while (wordNodes.length < state.words.length) {
      const node = makeElement('div', 'word');
      wordNodes.push(node);
      track.append(node);
    }
    state.words.forEach((word, i) => drawWord(i, word, state.inputs[i] ?? '', i < state.wordIndex));
    relayout();
  }

  function drawWord(index, target, input, committed) {
    const key = `${committed ? '+' : '-'}${input}`;
    if (drawn[index] === key) return;
    drawn[index] = key;
    const node = wordNodes[index];
    node.classList.toggle('is-error', committed && !isWordCorrect(target, input));
    node.replaceChildren(...classifyWord(target, input, committed).map((charState, i) =>
      makeElement('span', `ch is-${charState}`, i < target.length ? target[i] : input[i])));
  }

  function relayout() {
    if (state === null || wordNodes.length === 0) return;
    const index = Math.min(state.wordIndex, wordNodes.length - 1);
    const word = wordNodes[index];
    const lineHeight = word.offsetHeight;
    if (lineHeight === 0) return; // hidden
    const line = Math.round(word.offsetTop / lineHeight);
    track.style.transform = `translateY(${-Math.max(0, line - 1) * lineHeight}px)`;
    const x = caretOffset(word, state.inputs[index] ?? '');
    caret.style.transform = `translate(${x}px, ${word.offsetTop}px)`;
  }

  return { render, reset, relayout };
}

/** Left edge of the next letter to type, or the right edge of the word when it is fully typed. */
function caretOffset(word, input) {
  const letters = word.children;
  if (input.length < letters.length) return letters[input.length].offsetLeft;
  const last = letters[letters.length - 1];
  return last.offsetLeft + last.offsetWidth;
}
