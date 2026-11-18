// Lantern Keeper: every tunable number for the game, in one place.
// The night lasts 90 seconds; reach 200 points or survive to dawn to win.
export const FIELD = { width: 960, height: 600 };
export const STEP = 1 / 60;
export const NIGHT_SECONDS = 90;
export const WIN_SCORE = 400;
export const START_LIVES = 3;
export const MAX_LIVES = 5;
export const LEVEL_EVERY = 50;

export const PLAYER = {
  radius: 16,
  speed: 265,
  pickupRadius: 34,
  shootCooldown: 0.45,
  boltSpeed: 560,
  invulnSeconds: 1.6,
};

export const FRUIT = { radius: 11, value: 5, spawnEvery: 1.8, max: 5, comboWindow: 3 };
export const WISP = {
  radius: 15,
  spawnEvery: 1.4,
  max: 14,
  chaserSpeed: 138,
  drifterSpeed: 78,
  miniSpeed: 165,
};
export const BOLT = { radius: 6, life: 0.9, damage: 1 };

// One upgrade per level-up. Each entry: id, name, blurb, and what it changes.
export const UPGRADES = [
  { id: 'swift', name: 'Swift Boots', blurb: '+18% move speed', apply: (p) => { p.speedMul *= 1.18; } },
  { id: 'magnet', name: 'Fruit Magnet', blurb: 'Pickup radius +45%', apply: (p) => { p.pickupMul *= 1.45; } },
  { id: 'twin', name: 'Twin Lantern', blurb: 'Fire two bolts at once', apply: (p) => { p.shots += 1; } },
  { id: 'pierce', name: 'Piercing Light', blurb: 'Bolts pass through wisps', apply: (p) => { p.pierce = true; } },
  { id: 'heart', name: 'Warm Heart', blurb: '+1 life, right now', apply: (p) => { p.lives = Math.min(MAX_LIVES, p.lives + 1); } },
  { id: 'aegis', name: 'Aegis Glow', blurb: 'Shield for 6 seconds', apply: (p) => { p.shield = 6; } },
  { id: 'rapid', name: 'Quick Wick', blurb: 'Shoot 30% faster', apply: (p) => { p.cooldownMul *= 0.7; } },
  { id: 'golden', name: 'Golden Touch', blurb: 'Double points for 12s', apply: (p) => { p.doubleTime = 12; } },
  { id: 'calm', name: 'Calm Night', blurb: 'Combo lasts twice as long', apply: (p) => { p.comboWindowMul *= 2; } },
];

export const POWERUPS = [
  { id: 'heart', name: 'Heart', color: '#ff6b81' },
  { id: 'shield', name: 'Shield', color: '#7dd3fc' },
  { id: 'magnet', name: 'Magnet', color: '#facc15' },
  { id: 'star', name: 'Star', color: '#fbbf24' },
];

export const PALETTE = {
  skyTop: '#0b1026',
  skyMid: '#1b2a4a',
  skyBottom: '#274b5f',
  ground: '#12291f',
  groundLine: '#1f4d33',
  lantern: '#ffd166',
  fruit: '#a7f3d0',
  fruitCore: '#34d399',
  wisp: '#7c3aed',
  wispEye: '#fde68a',
  bolt: '#fef08a',
  text: '#f8fafc',
  dim: '#94a3b8',
  danger: '#f87171',
};
