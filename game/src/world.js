// Lantern Keeper: the rules, with no DOM and no sound in here.
// A step takes (dt, input) and returns the events that happened, so main.js
// can play sounds and render can draw feedback for them.
import { FIELD, STEP, NIGHT_SECONDS, WIN_SCORE, START_LIVES, MAX_LIVES, LEVEL_EVERY, PLAYER, FRUIT, WISP, BOLT, UPGRADES } from './config.js';
import { makeRng, range, shuffle } from './random.js';

export const EVENT_COLLECT = 'collect';
export const EVENT_SHOOT = 'shoot';
export const EVENT_KILL = 'kill';
export const EVENT_HURT = 'hurt';
export const EVENT_POWERUP = 'powerup';
export const EVENT_LEVELUP = 'levelup';
export const EVENT_WIN = 'win';
export const EVENT_LOSE = 'lose';
export const EVENT_OVER = 'over';

export function createWorld(seed = 1) {
  const world = {
    seed,
    rng: makeRng(seed),
    time: 0,
    score: 0,
    best: 0,
    combo: 0,
    comboTimer: 0,
    lives: START_LIVES,
    level: 1,
    kills: 0,
    collected: 0,
    over: false,
    won: false,
    reason: '',
    pendingLevelUp: false,
    choices: [],
    fruitTimer: 0.4,
    wispTimer: 2.2,
    powerTimer: 16,
    shake: 0,
    flash: 0,
    mods: { speedMul: 1, pickupMul: 1, shots: 1, pierce: false, cooldownMul: 1, comboWindowMul: 1 },
    player: {
      x: FIELD.width / 2, y: FIELD.height * 0.62, r: PLAYER.radius,
      cooldown: 0, invuln: 0, shield: 0, doubleTime: 0, magnetTime: 0, faceX: 0, faceY: -1,
    },
    fruits: [],
    wisps: [],
    bolts: [],
    powerups: [],
    particles: [],
    floats: [],
    stars: [],
  };
  for (let i = 0; i < 70; i += 1) {
    world.stars.push({ x: world.rng() * FIELD.width, y: world.rng() * FIELD.height * 0.7, r: 0.6 + world.rng() * 1.4, tw: world.rng() * 6.28 });
  }
  return world;
}

export function resetWorld(world, seed = 1) {
  const fresh = createWorld(seed);
  Object.keys(world).forEach((k) => delete world[k]);
  Object.assign(world, fresh);
}

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

function dist2(ax, ay, bx, by) {
  const dx = ax - bx;
  const dy = ay - by;
  return dx * dx + dy * dy;
}

function burst(world, x, y, color, n, speed) {
  for (let i = 0; i < n; i += 1) {
    const a = world.rng() * Math.PI * 2;
    const s = speed * (0.3 + world.rng() * 0.7);
    world.particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0.5, maxLife: 0.5, color, size: 2 + world.rng() * 3 });
  }
}

function addFloat(world, x, y, text, color) {
  world.floats.push({ x, y, text, life: 0.9, color });
}

function spawnFruit(world, golden = false) {
  const margin = 50;
  world.fruits.push({
    x: range(world.rng, margin, FIELD.width - margin),
    y: range(world.rng, 90, FIELD.height - 70),
    r: golden ? 13 : FRUIT.radius,
    value: golden ? 15 : FRUIT.value,
    golden,
    bob: world.rng() * 6.28,
    born: world.time,
  });
}

function spawnWisp(world) {
  const roll = world.rng();
  const kind = world.level >= 3 && roll < 0.18 ? 'splitter' : roll < 0.62 ? 'chaser' : 'drifter';
  const edge = Math.floor(world.rng() * 4);
  let x;
  let y;
  if (edge === 0) { x = world.rng() * FIELD.width; y = 60; }
  else if (edge === 1) { x = world.rng() * FIELD.width; y = FIELD.height - 30; }
  else if (edge === 2) { x = 30; y = world.rng() * FIELD.height; }
  else { x = FIELD.width - 30; y = world.rng() * FIELD.height; }
  const speedMul = 1 + (world.level - 1) * 0.06;
  world.wisps.push({
    x, y, kind,
    r: kind === 'splitter' ? 19 : WISP.radius,
    hp: kind === 'splitter' ? 2 : kind === 'chaser' ? 2 : 1,
    speed: (kind === 'chaser' ? WISP.chaserSpeed : WISP.drifterSpeed) * speedMul,
    vx: 0, vy: 0, wobble: world.rng() * 6.28,
  });
}

function spawnPowerup(world) {
  const kinds = ['heart', 'shield', 'magnet', 'star'];
  const kind = kinds[Math.floor(world.rng() * kinds.length)];
  world.powerups.push({
    x: range(world.rng, 60, FIELD.width - 60),
    y: range(world.rng, 90, FIELD.height - 80),
    kind, r: 13, bob: world.rng() * 6.28,
  });
}

function offerLevelUp(world, events) {
  world.pendingLevelUp = true;
  world.choices = shuffle(world.rng, UPGRADES).slice(0, 3);
  events.push(EVENT_LEVELUP);
}

export function applyUpgrade(world, choice) {
  if (!choice) return;
  const p = world.player;
  if (choice.id === 'heart') {
    world.lives = Math.min(MAX_LIVES, world.lives + 1);
  } else if (choice.id === 'aegis') {
    p.shield = 6;
  } else if (choice.id === 'golden') {
    p.doubleTime = 12;
  } else {
    choice.apply(world.mods);
  }
  world.pendingLevelUp = false;
  world.choices = [];
}

// One fixed step. input: {mx, my, shoot, aimX, aimY, pointerDown, pointerX, pointerY}
export function stepWorld(world, dt, input) {
  const events = [];
  if (world.over || world.pendingLevelUp) return events;
  const p = world.player;
  world.time += dt;
  const timeLeft = NIGHT_SECONDS - world.time;

  // Timers.
  p.cooldown = Math.max(0, p.cooldown - dt);
  p.invuln = Math.max(0, p.invuln - dt);
  p.shield = Math.max(0, p.shield - dt);
  p.doubleTime = Math.max(0, p.doubleTime - dt);
  p.magnetTime = Math.max(0, p.magnetTime - dt);
  world.shake = Math.max(0, world.shake - dt * 3);
  world.flash = Math.max(0, world.flash - dt * 2);
  if (world.comboTimer > 0) {
    world.comboTimer -= dt;
    if (world.comboTimer <= 0) world.combo = 0;
  }

  // Movement: keys first, else steer toward a held pointer.
  let mx = input.mx || 0;
  let my = input.my || 0;
  if (mx === 0 && my === 0 && input.pointerDown) {
    const dx = input.pointerX - p.x;
    const dy = input.pointerY - p.y;
    const d = Math.hypot(dx, dy);
    if (d > 12) { mx = dx / d; my = dy / d; }
  }
  const speed = PLAYER.speed * world.mods.speedMul;
  p.x = clamp(p.x + mx * speed * dt, p.r + 8, FIELD.width - p.r - 8);
  p.y = clamp(p.y + my * speed * dt, 64 + p.r, FIELD.height - p.r - 8);
  if (mx !== 0 || my !== 0) { p.faceX = mx; p.faceY = my; }

  // Shooting: aim at the pointer, else at the nearest wisp, else facing.
  if (input.shoot && p.cooldown <= 0) {
    let ax = p.x + p.faceX * 40;
    let ay = p.y + p.faceY * 40;
    if (input.aimX !== undefined && input.aimY !== undefined) { ax = input.aimX; ay = input.aimY; }
    else {
      let best = null;
      let bestD = Infinity;
      for (const w of world.wisps) {
        const d = dist2(p.x, p.y, w.x, w.y);
        if (d < bestD) { bestD = d; best = w; }
      }
      if (best) { ax = best.x; ay = best.y; }
    }
    const ang = Math.atan2(ay - p.y, ax - p.x);
    const n = world.mods.shots;
    for (let i = 0; i < n; i += 1) {
      const off = (i - (n - 1) / 2) * 0.16;
      const a = ang + off;
      world.bolts.push({ x: p.x + Math.cos(a) * 20, y: p.y + Math.sin(a) * 20, vx: Math.cos(a) * PLAYER.boltSpeed, vy: Math.sin(a) * PLAYER.boltSpeed, life: BOLT.life, pierce: world.mods.pierce });
    }
    p.cooldown = PLAYER.shootCooldown * world.mods.cooldownMul;
    events.push(EVENT_SHOOT);
  }

  // Spawning.
  world.fruitTimer -= dt;
  if (world.fruitTimer <= 0 && world.fruits.length < FRUIT.max) {
    spawnFruit(world, world.rng() < 0.12);
    world.fruitTimer = FRUIT.spawnEvery * (0.8 + world.rng() * 0.4);
  }
  world.wispTimer -= dt;
  const wispEvery = WISP.spawnEvery * Math.max(0.45, 1 - (world.level - 1) * 0.07);
  if (world.wispTimer <= 0 && world.wisps.length < WISP.max) {
    spawnWisp(world);
    world.wispTimer = wispEvery * (0.7 + world.rng() * 0.6);
  }
  world.powerTimer -= dt;
  if (world.powerTimer <= 0) {
    spawnPowerup(world);
    world.powerTimer = 16 + world.rng() * 8;
  }

  // Fruits: bob, magnet pull, pickup.
  const pickupR = PLAYER.pickupRadius * world.mods.pickupMul * (p.magnetTime > 0 ? 2.2 : 1);
  for (let i = world.fruits.length - 1; i >= 0; i -= 1) {
    const f = world.fruits[i];
    f.bob += dt * 2;
    if (p.magnetTime > 0) {
      const d = Math.hypot(p.x - f.x, p.y - f.y);
      if (d < 180 && d > 1) { f.x += ((p.x - f.x) / d) * 220 * dt; f.y += ((p.y - f.y) / d) * 220 * dt; }
    }
    if (dist2(p.x, p.y, f.x, f.y) < (pickupR + f.r) * (pickupR + f.r)) {
      world.fruits.splice(i, 1);
      world.collected += 1;
      world.combo += 1;
      world.comboTimer = FRUIT.comboWindow * world.mods.comboWindowMul;
      const mult = (1 + Math.min(world.combo, 10) * 0.08) * (p.doubleTime > 0 ? 2 : 1);
      const gained = Math.round(f.value * mult);
      world.score += gained;
      burst(world, f.x, f.y, f.golden ? '#fbbf24' : '#a7f3d0', f.golden ? 14 : 8, 120);
      addFloat(world, f.x, f.y - 14, `+${gained}`, f.golden ? '#fbbf24' : '#a7f3d0');
      events.push(EVENT_COLLECT);
      const nextLevelAt = world.level * LEVEL_EVERY;
      if (world.score >= nextLevelAt && world.level * LEVEL_EVERY <= WIN_SCORE) {
        world.level += 1;
        offerLevelUp(world, events);
      }
    }
  }

  // Powerups.
  for (let i = world.powerups.length - 1; i >= 0; i -= 1) {
    const u = world.powerups[i];
    u.bob += dt * 2;
    if (dist2(p.x, p.y, u.x, u.y) < (pickupR + u.r) * (pickupR + u.r)) {
      world.powerups.splice(i, 1);
      if (u.kind === 'heart') world.lives = Math.min(MAX_LIVES, world.lives + 1);
      if (u.kind === 'shield') p.shield = 6;
      if (u.kind === 'magnet') p.magnetTime = 8;
      if (u.kind === 'star') p.doubleTime = 10;
      burst(world, u.x, u.y, '#facc15', 10, 100);
      addFloat(world, u.x, u.y - 14, u.kind.toUpperCase(), '#facc15');
      events.push(EVENT_POWERUP);
    }
  }

  // Wisps move.
  for (const w of world.wisps) {
    w.wobble += dt * 2;
    if (w.kind === 'chaser' || w.kind === 'mini') {
      const d = Math.hypot(p.x - w.x, p.y - w.y) || 1;
      w.vx = ((p.x - w.x) / d) * w.speed;
      w.vy = ((p.y - w.y) / d) * w.speed;
    } else {
      w.vx = Math.cos(w.wobble) * w.speed * 0.6 + ((p.x - w.x) / 800) * w.speed * 0.4;
      w.vy = Math.sin(w.wobble * 1.3) * w.speed * 0.6 + 20;
    }
    if (w.kind === 'splitter') {
      w.vx = Math.cos(w.wobble * 0.7) * w.speed * 0.5 + ((p.x - w.x) / 900) * w.speed * 0.5;
      w.vy = Math.sin(w.wobble) * w.speed * 0.5 + 30;
    }
    w.x += w.vx * dt;
    w.y += w.vy * dt;
    w.x = clamp(w.x, 20, FIELD.width - 20);
    w.y = clamp(w.y, 56, FIELD.height - 20);
  }

  // Bolts move and hit wisps.
  for (let i = world.bolts.length - 1; i >= 0; i -= 1) {
    const b = world.bolts[i];
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.life -= dt;
    let dead = b.life <= 0 || b.x < 0 || b.x > FIELD.width || b.y < 50 || b.y > FIELD.height;
    if (!dead) {
      for (let j = world.wisps.length - 1; j >= 0; j -= 1) {
        const w = world.wisps[j];
        if (dist2(b.x, b.y, w.x, w.y) < (w.r + BOLT.radius) * (w.r + BOLT.radius)) {
          w.hp -= BOLT.damage;
          burst(world, w.x, w.y, '#c4b5fd', 6, 90);
          if (w.hp <= 0) {
            world.wisps.splice(j, 1);
            world.kills += 1;
            world.score += 5;
            addFloat(world, w.x, w.y - 14, '+5', '#c4b5fd');
            burst(world, w.x, w.y, '#a78bfa', 14, 160);
            events.push(EVENT_KILL);
            if (w.kind === 'splitter') {
              for (let k = 0; k < 2; k += 1) {
                world.wisps.push({ x: w.x + (k ? 18 : -18), y: w.y, kind: 'mini', r: 9, hp: 1, speed: WISP.miniSpeed, vx: 0, vy: 0, wobble: world.rng() * 6.28 });
              }
            }
          }
          if (!b.pierce) { dead = true; }
          break;
        }
      }
    }
    if (dead) world.bolts.splice(i, 1);
  }

  // Wisps touch the player.
  for (let i = world.wisps.length - 1; i >= 0; i -= 1) {
    const w = world.wisps[i];
    if (dist2(p.x, p.y, w.x, w.y) < (p.r + w.r - 4) * (p.r + w.r - 4)) {
      world.wisps.splice(i, 1);
      burst(world, w.x, w.y, '#7c3aed', 12, 140);
      if (p.shield > 0 || p.invuln > 0) {
        addFloat(world, p.x, p.y - 24, 'BLOCKED', '#7dd3fc');
        continue;
      }
      world.lives -= 1;
      world.combo = 0;
      world.comboTimer = 0;
      p.invuln = PLAYER.invulnSeconds;
      world.shake = 0.45;
      world.flash = 0.6;
      events.push(EVENT_HURT);
      if (world.lives <= 0) {
        world.over = true;
        world.won = false;
        world.reason = 'The shadows caught the keeper.';
        events.push(EVENT_LOSE, EVENT_OVER);
        return events;
      }
    }
  }

  // Win: score goal, or survive the night.
  if (world.score >= WIN_SCORE) {
    world.over = true;
    world.won = true;
    world.reason = `You gathered ${WIN_SCORE} light and lit the dawn.`;
    events.push(EVENT_WIN, EVENT_OVER);
    return events;
  }
  if (timeLeft <= 0) {
    world.over = true;
    world.won = true;
    world.reason = 'You survived the night. Dawn breaks.';
    events.push(EVENT_WIN, EVENT_OVER);
    return events;
  }

  // Particles and floating text.
  for (let i = world.particles.length - 1; i >= 0; i -= 1) {
    const pt = world.particles[i];
    pt.x += pt.vx * dt;
    pt.y += pt.vy * dt;
    pt.vy += 60 * dt;
    pt.life -= dt;
    if (pt.life <= 0) world.particles.splice(i, 1);
  }
  for (let i = world.floats.length - 1; i >= 0; i -= 1) {
    const f = world.floats[i];
    f.y -= 34 * dt;
    f.life -= dt;
    if (f.life <= 0) world.floats.splice(i, 1);
  }
  return events;
}

export { STEP };
