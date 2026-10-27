/**
 * Creates a deterministic word source that draws random words from a list.
 * The same word never comes up twice in a row (unless the list has one word).
 * @param {readonly string[]} list - candidate words, at least one
 * @param {() => number} rng - random function returning floats in [0, 1), e.g. from createRng
 * @returns {() => string} a function that returns the next word on every call
 */
export function createWordGenerator(list, rng) {
  if (list.length === 0) throw new RangeError('The word list is empty.');
  let previous = -1;
  return function nextWord() {
    let index = Math.floor(rng() * list.length);
    if (index === previous) {
      index = (index + 1 + Math.floor(rng() * (list.length - 1))) % list.length;
    }
    previous = index;
    return list[index];
  };
}
