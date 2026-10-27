/**
 * Interface strings in English and Turkish, plus number formatting.
 * Pure module: no DOM access, so the tests can import it.
 */

/** Interface languages; the first one is the default. */
export const UI_LANGUAGES = Object.freeze(['en', 'tr']);

const LOCALES = Object.freeze({ en: 'en-US', tr: 'tr-TR' });

/** Every visible string of the interface, by language and key. */
export const STRINGS = Object.freeze({
  en: Object.freeze({
    docTitle: 'Typing Test',
    title: 'Typing Test',
    langToggle: 'TR',
    langToggleLabel: 'TR: switch to Turkish',
    settings: 'Test settings',
    modeGroup: 'Test mode',
    'mode.time': 'time',
    'mode.words': 'words',
    lengthGroup: 'Test length',
    'length.time': '{n} seconds',
    'length.words': '{n} words',
    listGroup: 'Word list',
    'list.en': 'English',
    'list.tr': 'Turkish',
    testLabel: 'Typing test',
    'status.ready': 'the clock starts with your first key',
    'status.best': 'best {wpm}',
    'unit.wpm': 'wpm',
    'unit.seconds': '{n} s',
    inputLabel: 'Type the words shown',
    focusHint: 'Click or tap here to type',
    trNote: 'Turkish letters must match exactly: ı ≠ i, İ ≠ I',
    restart: 'Restart',
    next: 'Next test',
    restartHint: 'restart',
    nextHint: 'next test',
    'results.title': 'Result',
    'results.newBest': 'New best!',
    'results.best': 'Best: {wpm} wpm',
    'stat.accuracy': 'accuracy',
    'stat.raw': 'raw',
    'stat.consistency': 'consistency',
    'stat.errors': 'errors',
    'stat.chars': 'characters',
    'stat.charsHint': 'correct / incorrect / extra / missed',
    'stat.time': 'time',
    'chart.label': 'Words per minute in each second of the test',
    source: 'Source on GitHub',
  }),
  tr: Object.freeze({
    docTitle: 'Yazma Hızı Testi',
    title: 'Yazma Hızı Testi',
    langToggle: 'EN',
    langToggleLabel: 'EN: İngilizceye geç',
    settings: 'Test ayarları',
    modeGroup: 'Test türü',
    'mode.time': 'süre',
    'mode.words': 'kelime',
    lengthGroup: 'Test uzunluğu',
    'length.time': '{n} saniye',
    'length.words': '{n} kelime',
    listGroup: 'Kelime listesi',
    'list.en': 'İngilizce',
    'list.tr': 'Türkçe',
    testLabel: 'Yazma testi',
    'status.ready': 'sayaç ilk tuşla başlar',
    'status.best': 'en iyi {wpm}',
    'unit.wpm': 'kelime/dk',
    'unit.seconds': '{n} sn',
    inputLabel: 'Gösterilen kelimeleri yaz',
    focusHint: 'Yazmak için buraya tıkla ya da dokun',
    trNote: 'Türkçe harfler birebir eşleşmeli: ı ≠ i, İ ≠ I',
    restart: 'Yeniden başlat',
    next: 'Sonraki test',
    restartHint: 'yeniden başlat',
    nextHint: 'sonraki test',
    'results.title': 'Sonuç',
    'results.newBest': 'Yeni rekor!',
    'results.best': 'En iyi: {wpm} kelime/dk',
    'stat.accuracy': 'doğruluk',
    'stat.raw': 'ham',
    'stat.consistency': 'tutarlılık',
    'stat.errors': 'hata',
    'stat.chars': 'karakter',
    'stat.charsHint': 'doğru / yanlış / fazla / eksik',
    'stat.time': 'süre',
    'chart.label': 'Testin her saniyesinde dakikadaki kelime sayısı',
    source: "Kaynak kod GitHub'da",
  }),
});

const numberFormats = new Map();

/**
 * Returns a supported interface language, English for anything else.
 * @param {unknown} value - e.g. a value read from storage
 * @returns {'en' | 'tr'}
 */
export function normalizeUiLanguage(value) {
  return UI_LANGUAGES.includes(value) ? value : UI_LANGUAGES[0];
}

/**
 * The language the toggle button switches to.
 * @param {'en' | 'tr'} lang - current interface language
 * @returns {'en' | 'tr'}
 */
export function otherUiLanguage(lang) {
  return lang === 'tr' ? 'en' : 'tr';
}

/**
 * String keys of the restart button and its Tab + Enter hint, so both name the
 * same action: a restart during a test, the next test on the results screen.
 * @param {boolean} finished - true while a result is shown
 * @returns {{label: string, hint: string}}
 */
export function restartActionKeys(finished) {
  return finished ? { label: 'next', hint: 'nextHint' } : { label: 'restart', hint: 'restartHint' };
}

/**
 * Looks up a string and fills its {placeholders}. Falls back to English, then to the key.
 * @param {'en' | 'tr'} lang
 * @param {string} key
 * @param {Record<string, string | number>} [params]
 * @returns {string}
 */
export function translate(lang, key, params = {}) {
  const text = STRINGS[lang]?.[key] ?? STRINGS.en[key] ?? key;
  return text.replace(/\{(\w+)\}/g, (match, name) => (name in params ? String(params[name]) : match));
}

/**
 * Formats a number for the interface language with a fixed number of decimals.
 * @param {number} value
 * @param {'en' | 'tr'} lang
 * @param {number} [digits] - decimals, default 0
 * @returns {string} e.g. "71.6" in English, "71,6" in Turkish
 */
export function formatNumber(value, lang, digits = 0) {
  return numberFormat(lang, digits, 'decimal').format(value);
}

/**
 * Formats a 0-100 value as a percentage in the interface language.
 * @param {number} value - percent, e.g. 97.9
 * @param {'en' | 'tr'} lang
 * @param {number} [digits] - decimals, default 0
 * @returns {string} e.g. "98%" in English, "%98" in Turkish
 */
export function formatPercent(value, lang, digits = 0) {
  return numberFormat(lang, digits, 'percent').format(value / 100);
}

/**
 * Short description of a test, e.g. "time 30 · English" or "kelime 25 · Türkçe".
 * @param {{mode: string, amount: number, lang: string}} settings - test settings
 * @param {'en' | 'tr'} uiLang - interface language
 * @returns {string}
 */
export function describeTest(settings, uiLang) {
  const mode = translate(uiLang, `mode.${settings.mode}`);
  const list = translate(uiLang, `list.${settings.lang}`);
  return `${mode} ${settings.amount} · ${list}`;
}

function numberFormat(lang, digits, style) {
  const locale = LOCALES[normalizeUiLanguage(lang)];
  const key = `${locale}|${digits}|${style}`;
  if (!numberFormats.has(key)) {
    numberFormats.set(key, new Intl.NumberFormat(locale, {
      style,
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }));
  }
  return numberFormats.get(key);
}
