import { createGame } from './game.js';
import { createRng } from './rng.js';

const DEMO_OPTIONS = Object.freeze({ mode: 'time', amount: 30, lang: 'en', seed: 2026 });
const TYPIST_SEED = 7;
/** Speed the scripted typist aims for in each second of the demo, in WPM. */
const SPEED_PROFILE = Object.freeze([
  58, 66, 72, 76, 78, 80, 79, 77, 80, 83,
  84, 82, 78, 74, 72, 75, 79, 82, 84, 85,
  83, 80, 78, 80, 83, 86, 87, 85, 84, 86,
]);
const TYPO_CHANCE = 0.035;
const FIX_CHANCE = 0.75;
/** Extra pause after a typo the typist is about to correct. */
const HESITATION_MS = 250;
const LETTERS = 'abcdefghijklmnopqrstuvwxyz';

/**
 * Builds a finished 30-second English test by replaying a scripted,
 * deterministic typist: its speed follows SPEED_PROFILE with small random
 * variations, and it makes a few typos, most of which it corrects.
 * Used for the ?demo view and the README screenshot.
 * @returns {import('./game.js').Game} a game whose status is "finished"
 */
export function createDemoGame() {
  const game = createGame(DEMO_OPTIONS);
  const typist = createTypist(createRng(TYPIST_SEED));
  let now = 0;
  while (game.getState().status !== 'finished') {
    now += typist(game, now);
  }
  return game;
}

/** Returns a function that performs the typist's next action and returns the delay until the one after. */
function createTypist(rng) {
  let fixing = false;
  return function act(game, now) {
    const { words, inputs, wordIndex } = game.getState();
    const target = words[wordIndex];
    const input = inputs[wordIndex];
    const delay = keyDelay(rng, now);
    if (fixing && !target.startsWith(input)) {
      game.backspace(now);
      return delay;
    }
    fixing = false;
    if (input.length >= target.length) {
      game.type(' ', now);
      return delay;
    }
    if (rng() < TYPO_CHANCE) {
      game.type(wrongLetter(rng, target[input.length]), now);
      fixing = rng() < FIX_CHANCE;
      return fixing ? delay + HESITATION_MS : delay;
    }
    game.type(target[input.length], now);
    return delay;
  };
}

function keyDelay(rng, elapsedMs) {
  const second = Math.min(SPEED_PROFILE.length - 1, Math.floor(elapsedMs / 1000));
  const msPerChar = 12_000 / SPEED_PROFILE[second];
  return msPerChar * (0.7 + 0.6 * rng());
}

function wrongLetter(rng, expected) {
  const pool = LETTERS.replace(expected, '');
  return pool[Math.floor(rng() * pool.length)];
}
