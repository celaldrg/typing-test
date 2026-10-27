/**
 * Entry point of the page: connects the typing test, the stored settings and
 * the views to the DOM. Every visible string comes from i18n.js.
 */
import { createDemoGame } from './demo.js';
import { makeElement, setText } from './dom.js';
import { applyEdit } from './field-edit.js';
import { createGame } from './game.js';
import { formatNumber, normalizeUiLanguage, otherUiLanguage, restartActionKeys, translate } from './i18n.js';
import { wordsPerMinute } from './metrics.js';
import { getBest, saveBest } from './records.js';
import { createResultsView } from './results-view.js';
import { MODE_OPTIONS, modeKey, normalizeSettings } from './settings.js';
import { readJSON, writeJSON } from './storage.js';
import { createTypingField } from './typing-field.js';
import { countNetChars } from './typing.js';
import { createWordsView } from './words-view.js';

const SETTINGS_KEY = 'settings';
const UI_LANG_KEY = 'ui-lang';
/** Live WPM is measured over at least one second, so the first keys do not show wild numbers. */
const MIN_LIVE_SPAN_MS = 1000;

const byId = (id) => document.getElementById(id);
const els = {
  uiLang: byId('ui-lang'),
  config: byId('config'),
  lengths: byId('length-group'),
  test: byId('test'),
  counter: byId('counter'),
  live: byId('live'),
  best: byId('best'),
  board: byId('board'),
  progress: byId('progress'),
  words: byId('words'),
  field: byId('field'),
  trNote: byId('tr-note'),
  results: byId('results'),
  restart: byId('restart'),
  restartLabel: byId('restart-label'),
  restartHint: byId('restart-hint'),
};

const app = {
  uiLang: normalizeUiLanguage(readJSON(UI_LANG_KEY, null)),
  settings: normalizeSettings(readJSON(SETTINGS_KEY, null)),
  game: null,
  isDemo: false,
  finished: false,
  frame: 0,
  pointerType: '',
};

const wordsView = createWordsView(els.words);
const resultsView = createResultsView(els.results);
const field = createTypingField(els.field, {
  currentInput,
  edit: (edit) => {
    applyEdit(app.game, edit, performance.now());
    refresh();
  },
  tab: () => els.restart.focus(),
});

start();

function start() {
  bindEvents();
  if (new URLSearchParams(window.location.search).has('demo')) showDemo();
  else restart(window.matchMedia('(pointer: fine)').matches);
  renderLanguage();
  updateFocusState();
}

function bindEvents() {
  els.uiLang.addEventListener('click', toggleUiLanguage);
  els.config.addEventListener('click', onConfigClick);
  els.restart.addEventListener('click', () => restart(true));
  els.test.addEventListener('click', () => field.focus());
  els.field.addEventListener('focus', updateFocusState);
  els.field.addEventListener('blur', updateFocusState);
  document.addEventListener('keydown', onPageKeyDown);
  document.addEventListener('pointerdown', (event) => {
    app.pointerType = event.pointerType;
  });
  new ResizeObserver(() => wordsView.relayout()).observe(els.words);
}

/** Starts a new test with new words; `focus` puts the keyboard focus into the typing field. */
function restart(focus) {
  stopClock();
  app.game = createGame({ ...app.settings, seed: randomSeed() });
  app.isDemo = false;
  app.finished = false;
  els.results.hidden = true;
  els.test.hidden = false;
  wordsView.reset();
  renderRestartAction();
  renderConfig();
  renderTestInfo();
  refresh();
  field.sync();
  if (focus) field.focus();
}

/** Shows the results of a finished, scripted 30-second test (the ?demo view). */
function showDemo() {
  app.game = createDemoGame();
  app.isDemo = true;
  app.settings = normalizeSettings(app.game.getState());
  finishTest(app.game.getState());
}

/** Only the seed of a new test comes from the platform; its words follow from the seeded RNG. */
function randomSeed() {
  return crypto.getRandomValues(new Uint32Array(1))[0];
}

function currentInput() {
  const { inputs, wordIndex } = app.game.getState();
  return inputs[wordIndex] ?? '';
}

/** Draws the state after a keystroke, then finishes the test or keeps its clock running. */
function refresh() {
  if (app.finished) return;
  const state = app.game.getState();
  if (state.status === 'finished') {
    finishTest(state);
    return;
  }
  wordsView.render(state);
  renderStatus(state);
  if (state.status === 'running' && app.frame === 0) app.frame = requestAnimationFrame(tick);
}

function tick() {
  app.frame = 0;
  if (app.finished) return;
  app.game.update(performance.now());
  const state = app.game.getState();
  if (state.status === 'finished') {
    finishTest(state);
    return;
  }
  renderStatus(state);
  app.frame = requestAnimationFrame(tick);
}

function stopClock() {
  cancelAnimationFrame(app.frame);
  app.frame = 0;
}

function finishTest(state) {
  stopClock();
  const record = app.isDemo ? null : saveBest(state.result);
  app.finished = true;
  field.blur();
  els.test.hidden = true;
  els.results.hidden = false;
  renderRestartAction();
  resultsView.show(state.result, record, app.uiLang);
}

function renderStatus(state) {
  setText(els.counter, counterText(state));
  setText(els.live, liveText(state));
  els.progress.style.transform = `scaleX(${progressOf(state)})`;
  els.board.classList.toggle('is-ready', state.status === 'ready');
}

/** Seconds left in a time test, words done in a words test. */
function counterText(state) {
  if (state.mode === 'time') return formatNumber(Math.ceil(state.remainingMs / 1000), app.uiLang);
  return `${formatNumber(state.wordsDone, app.uiLang)}/${formatNumber(state.amount, app.uiLang)}`;
}

function liveText(state) {
  if (state.status !== 'running') return translate(app.uiLang, 'status.ready');
  const chars = countNetChars(state.words, state.inputs, state.wordIndex);
  return wpmText(wordsPerMinute(chars, Math.max(state.elapsedMs, MIN_LIVE_SPAN_MS)));
}

function progressOf(state) {
  if (state.mode === 'time') return state.elapsedMs / (state.amount * 1000);
  return state.wordsDone / state.amount;
}

function wpmText(value) {
  return `${formatNumber(value, app.uiLang)} ${translate(app.uiLang, 'unit.wpm')}`;
}

/** The Turkish letters note and the best result of the selected mode. */
function renderTestInfo() {
  els.trNote.hidden = app.settings.lang !== 'tr';
  const best = getBest(app.settings);
  els.best.hidden = best === null;
  setText(els.best, best === null ? '' : translate(app.uiLang, 'status.best', { wpm: wpmText(best.wpm) }));
}

/** The restart button and its key hint say "Restart" during a test and "Next test" on the results. */
function renderRestartAction() {
  const keys = restartActionKeys(app.finished);
  setStringKey(els.restartLabel, keys.label);
  setStringKey(els.restartHint, keys.hint);
}

/** Gives an element another data-i18n key, which later language changes keep. */
function setStringKey(element, key) {
  element.dataset.i18n = key;
  setText(element, translate(app.uiLang, key));
}

function renderConfig() {
  const { mode, lang } = app.settings;
  for (const button of els.config.querySelectorAll('[data-mode]')) setPressed(button, button.dataset.mode === mode);
  for (const button of els.config.querySelectorAll('[data-list]')) setPressed(button, button.dataset.list === lang);
  renderLengthButtons();
}

/** Updates the length buttons in place, so a focused button keeps its focus. */
function renderLengthButtons() {
  const { mode, amount } = app.settings;
  const options = MODE_OPTIONS[mode];
  while (els.lengths.children.length < options.length) {
    const button = makeElement('button', 'seg__btn');
    button.type = 'button';
    els.lengths.append(button);
  }
  while (els.lengths.children.length > options.length) els.lengths.lastElementChild.remove();
  options.forEach((value, i) => {
    const button = els.lengths.children[i];
    button.dataset.amount = String(value);
    setText(button, formatNumber(value, app.uiLang));
    button.setAttribute('aria-label', translate(app.uiLang, `length.${mode}`, { n: value }));
    setPressed(button, value === amount);
  });
}

function setPressed(button, pressed) {
  button.setAttribute('aria-pressed', String(pressed));
}

function renderLanguage() {
  translateStaticText(app.uiLang);
  renderConfig();
  renderTestInfo();
  if (app.finished) resultsView.setLanguage(app.uiLang);
  else renderStatus(app.game.getState());
}

/** Fills every element marked with data-i18n, data-i18n-aria or data-i18n-title. */
function translateStaticText(lang) {
  document.documentElement.lang = lang;
  document.title = translate(lang, 'docTitle');
  for (const node of document.querySelectorAll('[data-i18n]')) {
    node.textContent = translate(lang, node.dataset.i18n);
  }
  for (const node of document.querySelectorAll('[data-i18n-aria]')) {
    node.setAttribute('aria-label', translate(lang, node.dataset.i18nAria));
  }
  for (const node of document.querySelectorAll('[data-i18n-title]')) {
    node.title = translate(lang, node.dataset.i18nTitle);
  }
}

function toggleUiLanguage() {
  app.uiLang = otherUiLanguage(app.uiLang);
  writeJSON(UI_LANG_KEY, app.uiLang);
  renderLanguage();
}

function onConfigClick(event) {
  const button = event.target.closest('button');
  if (button === null) return;
  // A mouse click sends the focus back to the words; keyboard users keep their place,
  // and touch users only get the on-screen keyboard when they tap the words.
  changeSettings(settingsPatch(button.dataset), event.detail > 0 && app.pointerType === 'mouse');
}

function settingsPatch({ mode, amount, list }) {
  if (mode !== undefined) return { mode };
  if (amount !== undefined) return { amount: Number(amount) };
  return { lang: list };
}

/** Starts a new test with the changed settings; the selected option only gives the focus back. */
function changeSettings(patch, focusField) {
  const next = normalizeSettings({ ...app.settings, ...patch });
  if (modeKey(next) === modeKey(app.settings)) {
    if (focusField && !app.finished) field.focus();
    return;
  }
  app.settings = next;
  writeJSON(SETTINGS_KEY, next);
  restart(focusField);
}

/**
 * Tab from anywhere outside a control goes to Restart, so Tab then Enter
 * restarts; a letter typed while the field lost focus brings the focus back.
 */
function onPageKeyDown(event) {
  if (event.target === els.field || event.defaultPrevented) return;
  if (event.key === 'Tab' && !event.shiftKey && isPageFocused(event.target)) {
    event.preventDefault();
    els.restart.focus();
  } else if (!app.finished && isTypingKey(event)) {
    field.focus();
  }
}

function isPageFocused(target) {
  return target === document.body || target === document.documentElement;
}

function isTypingKey(event) {
  return event.key.length === 1 && event.key !== ' ' && !event.ctrlKey && !event.metaKey && !event.altKey;
}

function updateFocusState() {
  els.board.classList.toggle('is-blurred', document.activeElement !== els.field);
}
