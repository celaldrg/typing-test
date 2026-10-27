/**
 * Pure axis helpers for the results chart.
 */

/** Steps between grid lines, as fractions of a power of ten. */
const NICE_FRACTIONS = Object.freeze([1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]);
/** Smallest axis maximum, so a slow test still gets a readable scale. */
const MIN_AXIS_MAX = 20;
/** Room above the highest value. */
const HEADROOM = 1.05;
/** Label steps in seconds for the time axis. */
const SECOND_STEPS = Object.freeze([1, 2, 5, 10, 15, 20, 30, 60, 120, 300]);

/**
 * Chooses a value axis from 0 to a round maximum with `ticks` equal steps.
 * @param {number} maxValue - largest value to show
 * @param {number} [ticks] - number of steps, default 4
 * @returns {{max: number, step: number}}
 */
export function valueAxis(maxValue, ticks = 4) {
  const top = Math.max(Number.isFinite(maxValue) ? maxValue * HEADROOM : 0, MIN_AXIS_MAX);
  const rough = top / ticks;
  const power = 10 ** Math.floor(Math.log10(rough));
  const fraction = NICE_FRACTIONS.find((nice) => nice * power >= rough - 1e-9);
  const step = fraction * power;
  return { max: step * ticks, step };
}

/**
 * Chooses how many seconds apart the time labels are, so that neighbouring
 * labels stay at least `minGapPx` apart.
 * @param {number} spanSeconds - seconds covered by the axis
 * @param {number} widthPx - width of the axis in pixels
 * @param {number} [minGapPx] - default 36
 * @returns {number} seconds between labels
 */
export function timeLabelStep(spanSeconds, widthPx, minGapPx = 36) {
  if (!(spanSeconds > 0) || !(widthPx > 0)) return SECOND_STEPS[0];
  const pxPerSecond = widthPx / spanSeconds;
  return SECOND_STEPS.find((step) => step * pxPerSecond >= minGapPx) ?? SECOND_STEPS.at(-1);
}
