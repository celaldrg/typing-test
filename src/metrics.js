/** Characters that make one "word" in WPM formulas. */
const CHARS_PER_WORD = 5;
const MS_PER_MINUTE = 60_000;

/**
 * Words per minute: (characters / 5) / minutes. Returns 0 for an empty time span.
 * @param {number} chars - characters typed in the span
 * @param {number} ms - length of the span in milliseconds
 * @returns {number}
 */
export function wordsPerMinute(chars, ms) {
  return ms > 0 ? (chars * MS_PER_MINUTE) / (CHARS_PER_WORD * ms) : 0;
}

/**
 * Share of correct keystrokes in percent. Returns 0 when nothing was typed.
 * @param {number} correct - correct keystrokes
 * @param {number} total - all counted keystrokes
 * @returns {number} 0-100
 */
export function accuracy(correct, total) {
  return total > 0 ? (correct * 100) / total : 0;
}

/**
 * Consistency score for a series of speed samples: 100 when every sample is
 * equal, falling towards 0 as they spread out. It maps the coefficient of
 * variation (standard deviation / mean) through 100 * (1 - tanh(cv)).
 * Returns 0 for no samples or a mean of 0.
 * @param {readonly number[]} samples - e.g. raw WPM per second
 * @returns {number} 0-100
 */
export function consistency(samples) {
  if (samples.length === 0) return 0;
  const mean = samples.reduce((sum, value) => sum + value, 0) / samples.length;
  if (mean <= 0) return 0;
  const variance = samples.reduce((sum, value) => sum + (value - mean) ** 2, 0) / samples.length;
  return 100 * (1 - Math.tanh(Math.sqrt(variance) / mean));
}
