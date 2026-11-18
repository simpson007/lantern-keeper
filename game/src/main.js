// Lantern Keeper: the game loop, screens and menus. The rules live in
// world.js, the drawing in render.js, the sounds in audio.js.
import { FIELD, STEP } from './config.js';
import { createWorld, resetWorld, stepWorld, applyUpgrade, EVENT_COLLECT, EVENT_SHOOT, EVENT_KILL, EVENT_HURT, EVENT_POWERUP, EVENT_LEVELUP, EVENT_WIN, EVENT_LOSE } from './world.js';
import { draw, SCREEN_TITLE, SCREEN_PLAY, SCREEN_LEVELUP, SCREEN_PAUSED, SCREEN_OVER, levelupCardRects } from './render.js';
import { stageShot } from './shots.js';
import { Input } from './input.js';
import { SoundBank } from './audio.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');
const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
const seed = Number(params.get('seed') || 1) || 1;

const sound = new SoundBank();
const input = new Input(canvas);
input.onFirstGesture = () => sound.unlock();

const world = createWorld(seed);
let screen = SCREEN_TITLE;
let best = 0;
try {
  best = Number(window.localStorage.getItem('lantern-keeper-best') || 0) || 0;
} catch {
  best = 0;
}

function saveBest() {
  if (world.score > best) {
    best = world.score;
    try { window.localStorage.setItem('lantern-keeper-best', String(best)); } catch { /* offline play without storage is fine */ }
  }
}

function announce(text) {
  if (statusEl) statusEl.textContent = text;
}

function playEvents(events) {
  for (const e of events) {
    if (e === EVENT_COLLECT) sound.collect(world.combo);
    else if (e === EVENT_SHOOT) sound.shoot();
    else if (e === EVENT_KILL) sound.hitWisp();
    else if (e === EVENT_HURT) sound.hurt();
    else if (e === EVENT_POWERUP) sound.powerup();
    else if (e === EVENT_LEVELUP) sound.levelup();
    else if (e === EVENT_WIN) sound.win();
    else if (e === EVENT_LOSE) sound.lose();
  }
}

function startGame() {
  resetWorld(world, (Date.now() % 100000) + 1);
  screen = SCREEN_PLAY;
  sound.unlock();
  sound.click();
  announce('Night begins. Collect glowfruit, dodge the wisps.');
}

function restart() {
  startGame();
}

function applyChoice(index) {
  const choice = world.choices[index];
  if (!choice) return;
  applyUpgrade(world, choice);
  sound.powerup();
  screen = SCREEN_PLAY;
  announce(`You chose ${choice.name}.`);
}

function inRect(x, y, r) {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

function handleClick(x, y) {
  if (screen === SCREEN_TITLE) { startGame(); return; }
  if (screen === SCREEN_OVER) { restart(); return; }
  if (screen === SCREEN_LEVELUP) {
    const rects = levelupCardRects();
    for (const r of rects) {
      if (inRect(x, y, r)) { applyChoice(r.index); return; }
    }
  }
}

// A screenshot scene: render one frame and stop. No loop, no input.
if (shotName) {
  const staged = stageShot(shotName, world, seed);
  screen = staged.screen;
  if (world.over) saveBest();
  draw(ctx, world, screen, { best: staged.best });
  announce(`Lantern Keeper, ${shotName} scene, score ${world.score}.`);
} else {
  let last = performance.now();
  let acc = 0;
  let lastAnnouncedScore = -1;

  function frame(now) {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;

    // Global keys.
    if (input.wasPressed('m')) {
      const muted = sound.toggleMute();
      announce(muted ? 'Sound off.' : 'Sound on.');
    }
    if (input.wasPressed('p') || input.wasPressed('escape')) {
      if (screen === SCREEN_PLAY) { screen = SCREEN_PAUSED; announce('Paused.'); }
      else if (screen === SCREEN_PAUSED) { screen = SCREEN_PLAY; announce('Playing.'); }
    }
    if (input.wasPressed('r') && (screen === SCREEN_OVER || screen === SCREEN_PLAY || screen === SCREEN_PAUSED)) {
      restart();
    }

    if (screen === SCREEN_TITLE) {
      if (input.wasPressed('enter') || input.wasPressed(' ') || input.pointer.clicked) {
        handleClick(input.pointer.x, input.pointer.y);
      }
    } else if (screen === SCREEN_OVER) {
      if (input.wasPressed('enter') || input.wasPressed(' ') || input.wasPressed('r') || input.pointer.clicked) {
        handleClick(input.pointer.x, input.pointer.y);
      }
    } else if (screen === SCREEN_LEVELUP) {
      if (input.wasPressed('1')) applyChoice(0);
      else if (input.wasPressed('2')) applyChoice(1);
      else if (input.wasPressed('3')) applyChoice(2);
      else if (input.pointer.clicked) handleClick(input.pointer.x, input.pointer.y);
    } else if (screen === SCREEN_PLAY) {
      const mv = input.moveVector();
      const shoot = input.held(' ') || input.pointer.clicked;
      acc += dt;
      while (acc >= STEP) {
        const events = stepWorld(world, STEP, {
          mx: mv.x, my: mv.y, shoot,
          aimX: input.pointer.x, aimY: input.pointer.y,
          pointerDown: input.pointer.down, pointerX: input.pointer.x, pointerY: input.pointer.y,
        });
        playEvents(events);
        acc -= STEP;
        if (world.pendingLevelUp) { screen = SCREEN_LEVELUP; break; }
        if (world.over) {
          saveBest();
          screen = SCREEN_OVER;
          announce(world.won ? `You win! Score ${world.score}.` : `Game over. Score ${world.score}.`);
          break;
        }
      }
      if (world.score !== lastAnnouncedScore && world.score % 50 === 0 && world.score > 0) {
        lastAnnouncedScore = world.score;
        announce(`Score ${world.score}. Level ${world.level}.`);
      }
    }

    draw(ctx, world, screen, { best });
    input.endFrame();
    requestAnimationFrame(frame);
  }

  draw(ctx, world, screen, { best });
  announce('Lantern Keeper. Press Enter or click to start.');
  requestAnimationFrame(frame);
}

export { FIELD };
