import { drawChart } from './chart.js';
import { setText } from './dom.js';
import { describeTest, formatNumber, formatPercent, translate } from './i18n.js';

/**
 * @typedef {object} ResultsView
 * @property {(result: import('./game.js').Result, record: {best: object | null, isNew: boolean} | null, lang: 'en' | 'tr') => void} show
 *   fills the card; `record` is the outcome of saveBest, or null when nothing was saved (the demo)
 * @property {(lang: 'en' | 'tr') => void} setLanguage - writes the numbers again in another language
 */

/**
 * Shows a finished test in the results card: the numbers, the best result and
 * the chart, which is drawn again whenever its box changes size.
 * @param {HTMLElement} root - the results card; values go into its [data-result] elements
 * @returns {ResultsView}
 */
export function createResultsView(root) {
  const canvas = root.querySelector('canvas');
  const slots = Object.fromEntries(
    [...root.querySelectorAll('[data-result]')].map((node) => [node.dataset.result, node]),
  );
  let shown = null;
  let lang = 'en';

  function drawCurrentChart() {
    if (shown !== null && !root.hidden) drawChart(canvas, shown.result.history, chartColors());
  }

  function render() {
    fillNumbers(slots, shown.result, lang);
    fillBest(slots.best, shown.record, lang);
    drawCurrentChart();
  }

  new ResizeObserver(drawCurrentChart).observe(canvas.parentElement);

  return {
    show(result, record, uiLang) {
      shown = { result, record };
      lang = uiLang;
      render();
    },
    setLanguage(uiLang) {
      lang = uiLang;
      if (shown !== null) render();
    },
  };
}

function fillNumbers(slots, result, lang) {
  setValue(slots.wpm, formatNumber(result.wpm, lang), formatNumber(result.wpm, lang, 2));
  setValue(slots.accuracy, formatPercent(result.accuracy, lang), formatPercent(result.accuracy, lang, 2));
  setValue(slots.raw, formatNumber(result.raw, lang), formatNumber(result.raw, lang, 2));
  setValue(slots.consistency, formatPercent(result.consistency, lang), formatPercent(result.consistency, lang, 2));
  setValue(slots.errors, formatNumber(result.errors, lang));
  setValue(slots.chars, charsText(result.chars, lang));
  setValue(slots.time, translate(lang, 'unit.seconds', { n: secondsText(result.durationMs, lang) }));
  setValue(slots.type, describeTest(result, lang));
}

/** Writes a value and its precise form as a tooltip; no tooltip keeps the one of the parent. */
function setValue(node, text, precise = '') {
  setText(node, text);
  if (precise) node.title = precise;
  else node.removeAttribute('title');
}

function charsText({ correct, incorrect, extra, missed }, lang) {
  return [correct, incorrect, extra, missed].map((count) => formatNumber(count, lang)).join('/');
}

function secondsText(durationMs, lang) {
  const seconds = durationMs / 1000;
  return formatNumber(seconds, lang, Number.isInteger(seconds) ? 0 : 1);
}

function fillBest(node, record, lang) {
  const text = bestText(record, lang);
  node.hidden = text === '';
  node.classList.toggle('is-new', record?.isNew === true);
  setText(node, text);
}

function bestText(record, lang) {
  if (record === null) return '';
  if (record.isNew) return translate(lang, 'results.newBest');
  if (record.best === null) return '';
  return translate(lang, 'results.best', { wpm: formatNumber(record.best.wpm, lang) });
}

/** Chart colours come from the CSS custom properties, so the theme lives in one place. */
function chartColors() {
  const style = getComputedStyle(document.documentElement);
  const read = (name) => style.getPropertyValue(name).trim();
  return {
    line: read('--accent'),
    fill: read('--chart-fill'),
    fillEnd: read('--chart-fill-end'),
    raw: read('--chart-raw'),
    grid: read('--chart-grid'),
    label: read('--muted'),
    error: read('--error'),
  };
}
