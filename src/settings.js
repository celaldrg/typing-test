/** Test lengths offered per mode: seconds for "time", word count for "words". */
export const MODE_OPTIONS = Object.freeze({
  time: Object.freeze([15, 30, 60]),
  words: Object.freeze([10, 25, 50]),
});

/** Word list languages. */
export const LANGUAGES = Object.freeze(['en', 'tr']);

const DEFAULT_MODE = 'time';
const DEFAULT_LANG = 'en';

/**
 * Returns valid test settings, replacing anything unknown with a default
 * (time mode, the middle length of the mode, English words). Safe to call with
 * untrusted data such as values read from storage or form fields.
 * @param {unknown} value - object with optional mode, amount and lang
 * @returns {{mode: 'time' | 'words', amount: number, lang: 'en' | 'tr'}}
 */
export function normalizeSettings(value) {
  const source = value !== null && typeof value === 'object' ? value : {};
  const mode = Object.keys(MODE_OPTIONS).includes(source.mode) ? source.mode : DEFAULT_MODE;
  const options = MODE_OPTIONS[mode];
  const amount = Number(source.amount);
  return {
    mode,
    amount: options.includes(amount) ? amount : options[1],
    lang: LANGUAGES.includes(source.lang) ? source.lang : DEFAULT_LANG,
  };
}

/**
 * Key that identifies a mode for best results, e.g. "time-30-en".
 * @param {unknown} settings - object with mode, amount and lang (normalized first)
 * @returns {string}
 */
export function modeKey(settings) {
  const { mode, amount, lang } = normalizeSettings(settings);
  return `${mode}-${amount}-${lang}`;
}
