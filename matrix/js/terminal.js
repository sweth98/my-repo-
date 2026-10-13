const MAX_LINES = 60;

const SYSTEM_MESSAGES = [
  'INITIALISING DIGITAL ENVIRONMENT...',
  'RENDERING SIMULATED REALITY...',
  'SYNCHRONISING DATA STREAMS...',
  'SYSTEM STATUS: OPERATIONAL',
  'REALITY CHECK: IN PROGRESS',
  'ALLOCATING PHANTOM MEMORY...',
  'VERIFYING OBSERVER SIGNATURE...',
];

/**
 * Minimal command console. Output lines are appended to a single log element (bounded),
 * and system messages are typed out from the main loop - no timers, no per-character DOM nodes.
 */
export class Terminal {
  constructor({ log, form, input, onKey }) {
    this.logEl = log;
    this.form = form;
    this.input = input;
    this.onKey = onKey;
    this.commands = new Map();
    this.history = [];
    this.histIdx = 0;
    this.queue = [];
    this.typing = null;
    this.sysTimer = 4;
    this.sysIdx = 0;
    this.enabled = false;

    this._submit = (e) => {
      e.preventDefault();
      const line = this.input.value.trim();
      this.input.value = '';
      if (!line) return;
      this.history.push(line);
      this.histIdx = this.history.length;
      this.print('> ' + line, 'echo');
      this.exec(line);
    };
    this._keydown = (e) => {
      if (this.onKey && e.key.length === 1) this.onKey();
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (this.histIdx > 0) this.input.value = this.history[--this.histIdx];
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        this.histIdx = Math.min(this.history.length, this.histIdx + 1);
        this.input.value = this.history[this.histIdx] || '';
      } else if (e.key === 'Tab') {
        e.preventDefault();
        const v = this.input.value.trim().toLowerCase();
        if (!v) return;
        const hit = [...this.commands.keys()].find((c) => c.startsWith(v));
        if (hit) this.input.value = hit;
      }
    };
    this.form.addEventListener('submit', this._submit);
    this.input.addEventListener('keydown', this._keydown);
  }

  register(name, help, fn) { this.commands.set(name, { help, fn }); }

  exec(line) {
    const [name, ...args] = line.toLowerCase().split(/\s+/);
    const cmd = this.commands.get(name);
    if (!cmd) { this.print(`unknown command: ${name}. type 'help'`, 'err'); return; }
    try { cmd.fn(args); } catch (err) { this.print('error: ' + err.message, 'err'); }
  }

  helpLines() { return [...this.commands].map(([n, c]) => `${n.padEnd(9)} ${c.help}`); }

  print(text, cls = '') {
    const el = document.createElement('div');
    el.className = 'line ' + cls;
    el.textContent = text;
    this._append(el);
    return el;
  }

  _append(el) {
    const log = this.logEl;
    const stick = log.scrollHeight - log.scrollTop - log.clientHeight < 40;
    log.appendChild(el);
    while (log.childElementCount > MAX_LINES) log.removeChild(log.firstElementChild);
    if (stick) log.scrollTop = log.scrollHeight;
  }

  /** Types a system message out over a few frames. */
  say(text, cls = 'sys') { this.queue.push({ text, cls }); }

  clear() {
    this.logEl.textContent = '';
    this.queue.length = 0;
    this.typing = null;
  }

  tick(dt) {
    if (!this.typing && this.queue.length) {
      const m = this.queue.shift();
      this.typing = { el: this.print('', m.cls), text: m.text, n: 0, acc: 0 };
    }
    if (this.typing) {
      const t = this.typing;
      t.acc += dt * 70;
      const add = Math.floor(t.acc);
      if (add > 0) {
        t.acc -= add;
        t.n = Math.min(t.text.length, t.n + add);
        t.el.textContent = t.text.slice(0, t.n);
        if (this.onKey && t.n % 2 === 0) this.onKey();
        this.logEl.scrollTop = this.logEl.scrollHeight;
        if (t.n >= t.text.length) this.typing = null;
      }
    } else if (this.enabled && !this.queue.length) {
      this.sysTimer -= dt;
      if (this.sysTimer <= 0) {
        this.say(SYSTEM_MESSAGES[this.sysIdx++ % SYSTEM_MESSAGES.length]);
        this.sysTimer = 7 + Math.random() * 4;
      }
    }
  }

  dispose() {
    this.form.removeEventListener('submit', this._submit);
    this.input.removeEventListener('keydown', this._keydown);
  }
}
