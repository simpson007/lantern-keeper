// Keyboard + mouse + touch input, kept apart from the game rules.
// main.js polls `held` each frame and drains `pressed` edge events.
export class Input {
  constructor(canvas) {
    this.keys = new Set();
    this.pressed = new Set();
    this.pointer = { x: 0, y: 0, down: false, clicked: false };
    this.canvas = canvas;
    this.onFirstGesture = null;

    window.addEventListener('keydown', (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
      if (!e.repeat) this.pressed.add(e.key.toLowerCase());
      this.keys.add(e.key.toLowerCase());
      this.gesture();
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.key.toLowerCase()));
    window.addEventListener('blur', () => this.keys.clear());

    const move = (e) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      this.pointer.x = (e.clientX - rect.left) * scaleX;
      this.pointer.y = (e.clientY - rect.top) * scaleY;
    };
    canvas.addEventListener('pointermove', move);
    canvas.addEventListener('pointerdown', (e) => {
      move(e);
      this.pointer.down = true;
      this.pointer.clicked = true;
      this.gesture();
    });
    window.addEventListener('pointerup', () => { this.pointer.down = false; });
  }

  gesture() {
    if (this.onFirstGesture) {
      const fn = this.onFirstGesture;
      this.onFirstGesture = null;
      fn();
    }
  }

  held(key) {
    return this.keys.has(key);
  }

  wasPressed(key) {
    return this.pressed.has(key);
  }

  // Movement vector from WASD / arrows, normalised; (0,0) when idle.
  moveVector() {
    let x = 0;
    let y = 0;
    if (this.held('a') || this.held('arrowleft')) x -= 1;
    if (this.held('d') || this.held('arrowright')) x += 1;
    if (this.held('w') || this.held('arrowup')) y -= 1;
    if (this.held('s') || this.held('arrowdown')) y += 1;
    if (x !== 0 && y !== 0) {
      const inv = 1 / Math.hypot(x, y);
      x *= inv;
      y *= inv;
    }
    return { x, y };
  }

  endFrame() {
    this.pressed.clear();
    this.pointer.clicked = false;
  }
}
