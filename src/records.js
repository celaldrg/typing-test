import { modeKey } from './settings.js';
import { readJSON, writeJSON } from './storage.js';

const RECORDS_KEY = 'best';
const RECORD_FIELDS = Object.freeze(['wpm', 'raw', 'accuracy', 'consistency']);

/**
 * @typedef {object} BestRecord
 * @property {number} wpm
 * @property {number} raw
 * @property {number} accuracy
 * @property {number} consistency
 */

/**
 * Returns the stored best result of a mode (mode, length and word list
 * language together), or null when there is none.
 * @param {{mode: string, amount: number, lang: string}} settings
 * @param {import('./storage.js').StorageLike | null} [backend] - defaults to localStorage
 * @returns {BestRecord | null}
 */
export function getBest(settings, backend) {
  const record = readRecords(backend)[modeKey(settings)];
  return isBestRecord(record) ? record : null;
}

/**
 * Stores a finished result when it beats the best result of its mode: a higher
 * WPM, or the same WPM with a higher accuracy. Results with 0 WPM are never stored.
 * @param {import('./game.js').Result} result
 * @param {import('./storage.js').StorageLike | null} [backend] - defaults to localStorage
 * @returns {{best: BestRecord | null, isNew: boolean}} the current best and whether this result is it
 */
export function saveBest(result, backend) {
  const records = readRecords(backend);
  const key = modeKey(result);
  const previous = isBestRecord(records[key]) ? records[key] : null;
  if (!(result.wpm > 0) || (previous !== null && !isBetter(result, previous))) {
    return { best: previous, isNew: false };
  }
  const best = Object.fromEntries(RECORD_FIELDS.map((field) => [field, result[field]]));
  writeJSON(RECORDS_KEY, { ...records, [key]: best }, backend);
  return { best, isNew: true };
}

function readRecords(backend) {
  const records = readJSON(RECORDS_KEY, {}, backend);
  return records !== null && typeof records === 'object' && !Array.isArray(records) ? records : {};
}

function isBestRecord(value) {
  if (value === null || typeof value !== 'object') return false;
  return RECORD_FIELDS.every((field) => Number.isFinite(value[field]));
}

function isBetter(result, best) {
  return result.wpm > best.wpm || (result.wpm === best.wpm && result.accuracy > best.accuracy);
}
