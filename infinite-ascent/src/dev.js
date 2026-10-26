// Development mode (?dev): scrub, inspect and validate the loop.
// Renders the first frame (t = 0) and the final frame (t = 35) side by side with a pixel diff.
import { DURATION } from './config.js';

export function initDev(film, { onSeek }) {
  const el = document.getElementById('dev');
  el.classList.add('on');
  el.innerHTML = `
    <h4>DEV — LOOP VALIDATION</h4>
    <div class="row"><button id="d-check">Compare t=0 ↔ t=35</button><button id="d-snap">Pose snapshot diff</button></div>
    <div class="row"><canvas id="d-a" width="270" height="480"></canvas><canvas id="d-b" width="270" height="480"></canvas></div>
    <div class="row"><canvas id="d-diff" width="270" height="480" style="width:150px;height:267px"></canvas></div>
    <pre id="d-out">press a button…</pre>`;
  const ca = el.querySelector('#d-a'); const cb = el.querySelector('#d-b'); const cd = el.querySelector('#d-diff');
  const out = el.querySelector('#d-out');
  const keep = film.t;

  const grab = (t, canvas) => {
    film.renderAt(t);
    const g = canvas.getContext('2d');
    g.drawImage(film.renderer.domElement, 0, 0, canvas.width, canvas.height);
    return g.getImageData(0, 0, canvas.width, canvas.height);
  };
  el.querySelector('#d-check').onclick = () => {
    const a = grab(0, ca); const b = grab(DURATION, cb);
    const g = cd.getContext('2d'); const img = g.createImageData(cd.width, cd.height);
    let max = 0; let sum = 0;
    for (let i = 0; i < a.data.length; i += 4) {
      const d = Math.max(Math.abs(a.data[i] - b.data[i]), Math.abs(a.data[i + 1] - b.data[i + 1]), Math.abs(a.data[i + 2] - b.data[i + 2]));
      max = Math.max(max, d); sum += d;
      const v = Math.min(255, d * 40); img.data[i] = v; img.data[i + 1] = v; img.data[i + 2] = v; img.data[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    out.textContent = `t=0 vs t=35\nmax channel diff : ${max}\nmean channel diff: ${(sum / (a.data.length / 4)).toFixed(4)}\n${max === 0 ? 'IDENTICAL — seamless loop' : 'DIFFERENT'}`;
    film.renderAt(keep); onSeek?.(keep);
  };
  el.querySelector('#d-snap').onclick = () => {
    const s0 = film.structure.snapshot(0); const s1 = film.structure.snapshot(DURATION);
    let bad = 0;
    s0.forEach((p, i) => { const q = s1[i]; if ((p[1] === null) !== (q[1] === null)) bad++; else if (p[1] !== null) for (let k = 1; k < p.length; k++) if (Math.abs(p[k] - q[k]) > 1e-9) { bad++; break; } });
    const c0 = []; const c1 = [];
    const P = film.rig; const v = film._pos.clone(); const l = film._look.clone();
    const f0 = P.sample(0, v, l); c0.push(...v.toArray(), ...l.toArray(), f0);
    const f1 = P.sample(DURATION, v, l); c1.push(...v.toArray(), ...l.toArray(), f1);
    const camDiff = Math.max(...c0.map((x, i) => Math.abs(x - c1[i])));
    out.textContent = `parts: ${s0.length}\nposes differing between t=0 and t=35: ${bad}\ncamera (pos/look/fov) max diff: ${camDiff.toExponential(2)}`;
  };
}
