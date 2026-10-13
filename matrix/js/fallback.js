// 2D canvas digital rain, used when WebGL2 is unavailable. Same control surface as MatrixScene
// for the parts the app uses (resize / update / render / dispose / camera inputs).

const CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ+-×÷=≠≈∑∏∫√∞∂∇πΔλμσ01'.split('');

export class FallbackRain {
  constructor(canvas, { reducedMotion = false } = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.reduced = reducedMotion;
    this.boot = 1;
    this.time = 0;
    this.level = 0;
    this.brightMul = 1;
    this.fallback = true;
    this.size = 18;
    this.cols = [];
    this.p = { speed: 1 };
    this.resize();
  }

  get quality() { return 0; }
  setQuality() {}
  setMode(key) { this.p.speed = key === 'deep' ? 0.6 : key === 'glitch' ? 1.5 : 1; }
  snapMode(key) { this.setMode(key); }
  setPointer() {}
  drag() {}
  kick() {}
  resetCamera() {}

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const w = Math.max(1, this.canvas.clientWidth || window.innerWidth);
    const h = Math.max(1, this.canvas.clientHeight || window.innerHeight);
    this.canvas.width = Math.floor(w * dpr);
    this.canvas.height = Math.floor(h * dpr);
    this.dpr = dpr; this.w = w; this.h = h;
    const n = Math.ceil(w / this.size);
    this.cols = Array.from({ length: n }, () => this._col(true));
    this.ctx.fillStyle = '#020403';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  _col(initial) {
    return {
      y: initial ? -Math.random() * this.h * 0.6 : -Math.random() * this.h * 0.6,
      v: 90 + Math.random() * 300, len: 8 + Math.random() * 22, last: '', lastRow: -1,
    };
  }

  update(dt, simDt) {
    this.time += simDt;
    const ctx = this.ctx;
    const s = this.size;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.fillStyle = 'rgba(2,4,3,0.085)';
    ctx.fillRect(0, 0, this.w, this.h);
    ctx.font = `${s - 2}px "JetBrains Mono",ui-monospace,Menlo,Consolas,monospace`;
    ctx.textAlign = 'center';
    for (let i = 0; i < this.cols.length; i++) {
      const c = this.cols[i];
      if (i / this.cols.length > this.boot) continue;
      const prev = Math.floor(c.y / s);
      c.y += c.v * simDt;
      const row = Math.floor(c.y / s);
      if (row !== prev && row >= 0) {
        const x = i * s + s / 2;
        if (c.last) { // demote the previous head to neon green
          ctx.fillStyle = '#020403';
          ctx.fillRect(x - s / 2, prev * s - 1, s, s);
          ctx.fillStyle = '#00FF41';
          ctx.fillText(c.last, x, prev * s + s - 4);
        }
        c.last = CHARS[(Math.random() * CHARS.length) | 0];
        ctx.fillStyle = '#D8FFE1';
        ctx.fillText(c.last, x, row * s + s - 4);
      }
      if (c.y - c.len * s * 3 > this.h) Object.assign(c, this._col(false));
    }
  }

  render() {}
  dispose() {}
}
