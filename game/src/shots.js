// Screenshot scenes behind ?shot=start|play|levelup|end.
// Each one plays the real rules forward from a fresh world, steered by a
// simple autopilot, so the frame is what a short game really looks like
// and the same seed always gives the same frame.
import { FIELD, STEP } from './config.js';
import { resetWorld, stepWorld, applyUpgrade, EVENT_OVER } from './world.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE, SCREEN_LEVELUP } from './render.js';

const SAMPLE_SECONDS = 1 / 30;

// Steer toward the nearest fruit, flee the nearest wisp when it is close,
// and shoot at the nearest wisp when it is in range. `brave` false means
// the pilot ignores wisps, so it gets caught, as a hurried player is.
function autopilot(world, brave) {
  const p = world.player;
  let fruit = null;
  let fruitD = Infinity;
  for (const f of world.fruits) {
    const d = (f.x - p.x) ** 2 + (f.y - p.y) ** 2;
    if (d < fruitD) { fruitD = d; fruit = f; }
  }
  let wisp = null;
  let wispD = Infinity;
  for (const w of world.wisps) {
    const d = (w.x - p.x) ** 2 + (w.y - p.y) ** 2;
    if (d < wispD) { wispD = d; wisp = w; }
  }
  let mx = 0;
  let my = 0;
  if (brave && wisp && wispD < 95 * 95) {
    mx = (p.x - wisp.x) / Math.sqrt(wispD);
    my = (p.y - wisp.y) / Math.sqrt(wispD);
  } else if (fruit) {
    mx = (fruit.x - p.x) / Math.sqrt(fruitD || 1);
    my = (fruit.y - p.y) / Math.sqrt(fruitD || 1);
  } else {
    mx = (FIELD.width / 2 - p.x) / FIELD.width;
    my = 0;
  }
  const len = Math.hypot(mx, my) || 1;
  return {
    mx: mx / len, my: my / len,
    shoot: brave && wisp !== null && wispD < 280 * 280,
    aimX: wisp ? wisp.x : undefined,
    aimY: wisp ? wisp.y : undefined,
    pointerDown: false, pointerX: p.x, pointerY: p.y,
  };
}

function runFor(world, seconds, brave, stopAtLevelUp) {
  const steps = Math.floor(seconds / STEP);
  for (let i = 0; i < steps; i += 1) {
    // A level-up pauses the world until a card is picked, so the pilot
    // picks the first card and keeps playing (except when we want the
    // level-up screen itself, where we stop as soon as it appears).
    if (world.pendingLevelUp) {
      if (stopAtLevelUp) return true;
      applyUpgrade(world, world.choices[0]);
    }
    const events = stepWorld(world, STEP, autopilot(world, brave));
    if (events.includes(EVENT_OVER)) return true;
    if (stopAtLevelUp && world.pendingLevelUp) return true;
  }
  return world.over;
}

// Set `world` to the named scene and return the screen to draw and the best score.
export function stageShot(name, world, seed = 1) {
  resetWorld(world, seed);
  if (name === 'levelup') {
    runFor(world, 120, true, true);
    return { screen: world.pendingLevelUp ? SCREEN_LEVELUP : SCREEN_PLAY, best: world.score };
  }
  if (name === 'play') {
    runFor(world, 26, true, false);
    return { screen: world.over ? SCREEN_OVER : SCREEN_PLAY, best: world.score };
  }
  if (name === 'end') {
    runFor(world, 120, false, false);
    return { screen: SCREEN_OVER, best: world.score };
  }
  // A short attract-mode drift, too short to score a level-up: the title
  // screen shows a fresh night with a few fruits and wisps already out.
  runFor(world, 2, true, false);
  return { screen: SCREEN_TITLE, best: 0 };
}

export { SAMPLE_SECONDS };
