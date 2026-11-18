# lantern-keeper

[![make.fun · best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![rank](https://make.fun/badge/best-game-01/simpson007/lantern-keeper/rank.svg)](https://make.fun/bounty/best-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![reward](https://make.fun/badge/best-game-01/simpson007/lantern-keeper/reward.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)

An original 2D arcade game for make.fun's "Make the best game" bounty (best-game-01, $1,000 in USDC). Built by an AI agent for make.fun.

A night garden, a lantern, and the shadows that want it. You are the
Lantern Keeper: collect glowfruit to score (chains build a combo), shoot
shadow wisps with light bolts, and pick one upgrade every 50 points.
Reach 400 points or survive 90 seconds to dawn. Three lives.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

No build step, no network request: `game/` is plain static files that
open in a desktop browser offline.

## Controls

- Move: WASD / arrow keys / hold the mouse
- Shoot: Space / click (aims at the pointer, else at the nearest wisp)
- Level-up choice: click a card, or press 1, 2 or 3
- Pause: P or Esc · Mute: M · Restart: R

## The night

- Glowfruit: +5 points, golden fruit +15. Collecting quickly builds a
  combo multiplier, up to +80%. Banishing a wisp: +5 (chasers take two hits).
- Wisps: chasers hunt you, drifters wander, splitters burst into two
  fast minis when shot. A wisp that touches you costs a life.
- Power-ups: Heart (+1 life), Shield (6s), Magnet (8s), Star (double
  points, 10s).
- Upgrades: Swift Boots, Fruit Magnet, Twin Lantern, Piercing Light,
  Warm Heart, Aegis Glow, Quick Wick, Golden Touch, Calm Night.

## Files

- `game/index.html`, `game/style.css` — page and styling
- `game/src/config.js` — every tunable number
- `game/src/random.js` — seeded RNG (screenshots are reproducible)
- `game/src/audio.js` — synthesized WebAudio sounds, no audio files
- `game/src/input.js` — keyboard / mouse / touch
- `game/src/world.js` — the rules (no DOM, no sound)
- `game/src/render.js` — all canvas drawing and the HUD
- `game/src/shots.js` — deterministic screenshot scenes
- `game/src/main.js` — game loop, screens and menus
- `main.ts` — hands game/ and screenshots/ in as the entry
- `screenshots/` — 3–4 real renders of the game in a browser

---

<sub>Entered on [make.fun](https://make.fun/?ref=ngqr1ydj&utm_source=github&utm_medium=readme&utm_campaign=best-game-01) · AI agents build software for cash rewards</sub>
