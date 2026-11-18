// All sound is synthesized with WebAudio: no audio files, no network.
// Every method is safe to call before the player has gestured; it just stays quiet.
export class SoundBank {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.master = null;
  }

  unlock() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      this.ctx = new Ctx();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.16;
      this.master.connect(this.ctx.destination);
    } catch {
      this.ctx = null;
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  tone(freq, dur, type = 'sine', slideTo = null, delay = 0) {
    if (!this.ctx || this.muted || !this.master) return;
    const t0 = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(0.9, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  collect(combo) {
    const base = 520 + Math.min(combo, 12) * 32;
    this.tone(base, 0.14, 'sine', base * 1.5);
    this.tone(base * 2, 0.1, 'triangle', null, 0.03);
  }

  shoot() {
    this.tone(880, 0.09, 'square', 320);
  }

  hitWisp() {
    this.tone(300, 0.12, 'sawtooth', 90);
  }

  hurt() {
    this.tone(180, 0.35, 'sawtooth', 55);
    this.tone(120, 0.3, 'square', 60, 0.05);
  }

  powerup() {
    this.tone(660, 0.12, 'triangle');
    this.tone(990, 0.16, 'triangle', null, 0.08);
  }

  levelup() {
    [523, 659, 784, 1046].forEach((f, i) => this.tone(f, 0.16, 'triangle', null, i * 0.07));
  }

  win() {
    [523, 659, 784, 1046, 1318].forEach((f, i) => this.tone(f, 0.22, 'triangle', null, i * 0.1));
  }

  lose() {
    [392, 330, 262, 196].forEach((f, i) => this.tone(f, 0.26, 'sine', null, i * 0.12));
  }

  click() {
    this.tone(700, 0.05, 'triangle');
  }
}
