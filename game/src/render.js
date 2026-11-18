// Lantern Keeper: everything drawn on the canvas, in one place.
import { FIELD, NIGHT_SECONDS, WIN_SCORE, PALETTE } from './config.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_LEVELUP = 'levelup';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';

export function levelupCardRects() {
  const w = 250;
  const h = 150;
  const gap = 24;
  const total = w * 3 + gap * 2;
  const x0 = (FIELD.width - total) / 2;
  const y = 250;
  return [0, 1, 2].map((i) => ({ x: x0 + i * (w + gap), y, w, h, index: i }));
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawBackground(ctx, world, time) {
  const g = ctx.createLinearGradient(0, 0, 0, FIELD.height);
  g.addColorStop(0, PALETTE.skyTop);
  g.addColorStop(0.55, PALETTE.skyMid);
  g.addColorStop(1, PALETTE.skyBottom);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  // Stars.
  for (const s of world.stars) {
    const a = 0.35 + 0.45 * Math.abs(Math.sin(time * 0.8 + s.tw));
    ctx.globalAlpha = a;
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  // Moon.
  ctx.fillStyle = '#fef9c3';
  ctx.beginPath();
  ctx.arc(830, 78, 34, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.skyTop;
  ctx.beginPath();
  ctx.arc(818, 70, 30, 0, Math.PI * 2);
  ctx.fill();
  // Garden ground.
  ctx.fillStyle = PALETTE.ground;
  ctx.fillRect(0, FIELD.height - 78, FIELD.width, 78);
  ctx.strokeStyle = PALETTE.groundLine;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, FIELD.height - 78);
  ctx.quadraticCurveTo(240, FIELD.height - 96, 480, FIELD.height - 78);
  ctx.quadraticCurveTo(720, FIELD.height - 60, FIELD.width, FIELD.height - 78);
  ctx.stroke();
  // Little grass tufts, deterministic from the stars list.
  ctx.strokeStyle = '#2d6a4f';
  ctx.lineWidth = 2;
  for (let i = 0; i < 24; i += 1) {
    const x = (i * 41 + 13) % FIELD.width;
    const y = FIELD.height - 34 - ((i * 17) % 30);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - 4, y - 12);
    ctx.moveTo(x + 3, y);
    ctx.lineTo(x + 6, y - 10);
    ctx.stroke();
  }
}

function drawFruit(ctx, f, time) {
  const bob = Math.sin(f.bob) * 3;
  const y = f.y + bob;
  ctx.save();
  ctx.shadowColor = f.golden ? '#fbbf24' : '#34d399';
  ctx.shadowBlur = 16;
  ctx.fillStyle = f.golden ? '#fbbf24' : PALETTE.fruitCore;
  ctx.beginPath();
  ctx.arc(f.x, y, f.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = f.golden ? '#fef3c7' : '#d1fae5';
  ctx.beginPath();
  ctx.arc(f.x - 3, y - 3, f.r * 0.45, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawWisp(ctx, w, time) {
  const wob = Math.sin(w.wobble * 2) * 2;
  ctx.save();
  ctx.translate(w.x, w.y + wob);
  ctx.shadowColor = PALETTE.wisp;
  ctx.shadowBlur = 14;
  ctx.fillStyle = w.kind === 'splitter' ? '#6d28d9' : w.kind === 'mini' ? '#a855f7' : '#7c3aed';
  ctx.beginPath();
  ctx.arc(0, 0, w.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  // Ragged tail.
  ctx.fillStyle = 'rgba(124,58,237,0.55)';
  ctx.beginPath();
  ctx.moveTo(-w.r * 0.7, 4);
  ctx.lineTo(0, w.r + 10);
  ctx.lineTo(w.r * 0.7, 4);
  ctx.closePath();
  ctx.fill();
  // Eyes.
  ctx.fillStyle = PALETTE.wispEye;
  ctx.beginPath();
  ctx.arc(-5, -3, 2.6, 0, Math.PI * 2);
  ctx.arc(5, -3, 2.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1e1b4b';
  ctx.beginPath();
  ctx.arc(-5, -3, 1.2, 0, Math.PI * 2);
  ctx.arc(5, -3, 1.2, 0, Math.PI * 2);
  ctx.fill();
  if (w.kind === 'splitter') {
    ctx.fillStyle = '#fde68a';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('2', 0, 5);
  }
  ctx.restore();
}

function drawPlayer(ctx, world, time) {
  const p = world.player;
  const blink = p.invuln > 0 && Math.floor(time * 12) % 2 === 0;
  ctx.save();
  if (blink) ctx.globalAlpha = 0.45;
  // Lantern glow.
  const glow = ctx.createRadialGradient(p.x, p.y, 4, p.x, p.y, 78);
  glow.addColorStop(0, 'rgba(255,209,102,0.55)');
  glow.addColorStop(1, 'rgba(255,209,102,0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(p.x, p.y, 78, 0, Math.PI * 2);
  ctx.fill();
  // Body: a little keeper in a cloak.
  ctx.fillStyle = '#f59e0b';
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#78350f';
  ctx.beginPath();
  ctx.arc(p.x, p.y - 4, 7, 0, Math.PI * 2);
  ctx.fill();
  // Lantern in hand.
  ctx.fillStyle = PALETTE.lantern;
  ctx.fillRect(p.x + 10, p.y - 6, 7, 11);
  ctx.strokeStyle = '#78350f';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(p.x + 10, p.y - 6, 7, 11);
  // Shield ring.
  if (p.shield > 0) {
    ctx.strokeStyle = 'rgba(125,211,252,0.9)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r + 9, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawHud(ctx, world, best) {
  const timeLeft = Math.max(0, NIGHT_SECONDS - world.time);
  const mm = Math.floor(timeLeft / 60);
  const ss = String(Math.floor(timeLeft % 60)).padStart(2, '0');
  ctx.fillStyle = 'rgba(2,6,23,0.72)';
  ctx.fillRect(0, 0, FIELD.width, 56);
  ctx.fillStyle = PALETTE.text;
  ctx.font = 'bold 20px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`Score ${world.score}`, 16, 36);
  ctx.font = '16px sans-serif';
  ctx.fillStyle = world.combo > 1 ? '#fbbf24' : PALETTE.dim;
  ctx.fillText(world.combo > 1 ? `Combo x${world.combo}  (${world.comboTimer.toFixed(1)}s)` : 'Combo —', 170, 35);
  // Hearts.
  let hx = 380;
  for (let i = 0; i < world.lives; i += 1) {
    ctx.fillStyle = '#ff6b81';
    ctx.font = '20px sans-serif';
    ctx.fillText('♥', hx, 36);
    hx += 24;
  }
  ctx.fillStyle = PALETTE.text;
  ctx.font = '16px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`Level ${world.level}`, 560, 35);
  ctx.fillText(`Dawn in ${mm}:${ss}`, 680, 35);
  ctx.textAlign = 'right';
  ctx.fillText(`Best ${Math.max(best, world.score)}`, FIELD.width - 16, 35);
  // Progress to the win score.
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ctx.fillRect(16, 46, FIELD.width - 32, 6);
  ctx.fillStyle = '#34d399';
  ctx.fillRect(16, 46, (FIELD.width - 32) * Math.min(1, world.score / WIN_SCORE), 6);
  ctx.fillStyle = PALETTE.dim;
  ctx.font = '11px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`Win at ${WIN_SCORE} points — or survive the night`, 16, 68);
  if (world.player.doubleTime > 0) {
    ctx.fillStyle = '#fbbf24';
    ctx.textAlign = 'right';
    ctx.fillText(`DOUBLE POINTS ${Math.ceil(world.player.doubleTime)}s`, FIELD.width - 16, 68);
  }
}

function drawOverlay(ctx, title, lines, hint, color = PALETTE.text) {
  ctx.fillStyle = 'rgba(2,6,23,0.78)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  ctx.fillStyle = color;
  ctx.font = 'bold 44px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(title, FIELD.width / 2, 150);
  ctx.fillStyle = PALETTE.text;
  ctx.font = '18px sans-serif';
  lines.forEach((line, i) => ctx.fillText(line, FIELD.width / 2, 205 + i * 30));
  ctx.fillStyle = '#fbbf24';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText(hint, FIELD.width / 2, 205 + lines.length * 30 + 40);
}

export function draw(ctx, world, screen, ui) {
  const time = world.time;
  ctx.save();
  if (world.shake > 0) {
    ctx.translate((Math.random() - 0.5) * world.shake * 18, (Math.random() - 0.5) * world.shake * 18);
  }
  drawBackground(ctx, world, time);
  for (const f of world.fruits) drawFruit(ctx, f, time);
  for (const u of world.powerups) {
    ctx.save();
    ctx.shadowColor = '#facc15';
    ctx.shadowBlur = 12;
    ctx.fillStyle = u.kind === 'heart' ? '#ff6b81' : u.kind === 'shield' ? '#7dd3fc' : u.kind === 'magnet' ? '#facc15' : '#fbbf24';
    ctx.beginPath();
    ctx.arc(u.x, u.y + Math.sin(u.bob) * 3, u.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(u.kind === 'heart' ? '♥' : u.kind === 'shield' ? '◈' : u.kind === 'magnet' ? 'U' : '★', u.x, u.y + Math.sin(u.bob) * 3 + 4);
    ctx.restore();
  }
  for (const w of world.wisps) drawWisp(ctx, w, time);
  for (const b of world.bolts) {
    ctx.fillStyle = PALETTE.bolt;
    ctx.shadowColor = PALETTE.bolt;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(b.x, b.y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }
  for (const pt of world.particles) {
    ctx.globalAlpha = Math.max(0, pt.life / pt.maxLife);
    ctx.fillStyle = pt.color;
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  drawPlayer(ctx, world, time);
  for (const f of world.floats) {
    ctx.globalAlpha = Math.max(0, f.life / 0.9);
    ctx.fillStyle = f.color;
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(f.text, f.x, f.y);
  }
  ctx.globalAlpha = 1;
  if (world.flash > 0) {
    ctx.fillStyle = `rgba(248,113,113,${world.flash * 0.25})`;
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  }
  ctx.restore();

  if (screen === SCREEN_PLAY || screen === SCREEN_LEVELUP || screen === SCREEN_PAUSED) drawHud(ctx, world, ui.best);

  if (screen === SCREEN_TITLE) {
    drawOverlay(ctx, 'LANTERN KEEPER', [
      'A night garden, a lantern, and the shadows that want it.',
      'Collect glowfruit to score — chains build a combo.',
      'Shoot wisps with Space or a click. Chasers hunt you,',
      'drifters wander, splitters burst into two minis.',
      'Every 50 points, pick one upgrade. Reach 400 points',
      'or survive 90 seconds to dawn. Three lives — good luck.',
      '',
      'Move: WASD / arrows / mouse    Shoot: Space / click',
      'Pause: P    Mute: M    Restart: R',
    ], 'Press Enter, Space or click to start');
  } else if (screen === SCREEN_LEVELUP) {
    ctx.fillStyle = 'rgba(2,6,23,0.72)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 34px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`Level ${world.level} — choose an upgrade`, FIELD.width / 2, 190);
    ctx.fillStyle = PALETTE.text;
    ctx.font = '16px sans-serif';
    ctx.fillText('Click a card, or press 1, 2 or 3.', FIELD.width / 2, 220);
    const rects = levelupCardRects();
    world.choices.forEach((c, i) => {
      const r = rects[i];
      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2;
      roundRect(ctx, r.x, r.y, r.w, r.h, 12);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText(c.name, r.x + r.w / 2, r.y + 48);
      ctx.fillStyle = PALETTE.text;
      ctx.font = '15px sans-serif';
      ctx.fillText(c.blurb, r.x + r.w / 2, r.y + 82);
      ctx.fillStyle = PALETTE.dim;
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText(`[${i + 1}]`, r.x + r.w / 2, r.y + 118);
    });
  } else if (screen === SCREEN_PAUSED) {
    drawOverlay(ctx, 'PAUSED', ['The night waits for you.', 'Your lantern is still lit.'], 'Press P or Esc to keep playing');
  } else if (screen === SCREEN_OVER) {
    const title = world.won ? 'DAWN BREAKS — YOU WIN!' : 'THE LIGHT GOES OUT';
    drawOverlay(ctx, title, [
      world.reason,
      `Score ${world.score}   •   Best ${Math.max(ui.best, world.score)}`,
      `Fruit gathered ${world.collected}   •   Wisps banished ${world.kills}   •   Level ${world.level}`,
      '',
      world.won ? 'The garden glows again, thanks to you.' : 'The shadows keep the garden tonight.',
    ], 'Press R or click to play again', world.won ? '#a7f3d0' : '#f87171');
  }
}
