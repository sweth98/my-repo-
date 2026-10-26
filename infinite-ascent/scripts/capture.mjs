// Headless capture helpers (Playwright + software WebGL).
//   node scripts/capture.mjs stills [t1,t2,...]   -> out/stills/t_XX.XX.png
//   node scripts/capture.mjs loopcheck            -> compares t=0 and t=35 pixel-for-pixel
//   node scripts/capture.mjs frames [from] [to]   -> out/frames/f_00000.png (30 fps PNG sequence)
import { createRequire } from 'module';
import { mkdirSync, writeFileSync } from 'fs';
import { spawn } from 'child_process';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const [, , mode = 'stills', ...rest] = process.argv;
const W = +(process.env.W || 540);
const H = Math.round((W * 16) / 9);
const PORT = process.env.PORT || 5173;

async function startServer() {
  if (process.env.NO_SERVER) return null;
  const p = spawn('npx', ['vite', '--port', String(PORT), '--strictPort'], { stdio: 'ignore' });
  for (let i = 0; i < 60; i++) {
    try { const r = await fetch(`http://localhost:${PORT}/`); if (r.ok) return p; } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error('vite did not start');
}

const server = await startServer();
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl'] });
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
const logs = [];
page.on('console', (m) => { logs.push(`[${m.type()}] ${m.text()}`); });
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));
await page.goto(`http://localhost:${PORT}/?capture&paused&pr=1&shadow=${process.env.SHADOW || 2048}`);
await page.waitForFunction(() => window.__ascent && window.__ascent.film, null, { timeout: 120000 });

const shot = async (t, file, cam = null) => {
  await page.evaluate(([tt, c]) => { window.__ascent.film.debugCam = c; window.__ascent.render(tt); }, [t, cam]);
  const buf = await page.locator('canvas').first().screenshot({ type: 'png' });
  writeFileSync(file, buf);
};

try {
  if (mode === 'stills') {
    mkdirSync('out/stills', { recursive: true });
    const ts = (rest[0] ? rest[0].split(',').map(Number) : [0, 1, 2.5, 4, 6, 9, 12.5, 15, 18, 20, 21, 22.5, 26, 29.5, 32, 34, 35]);
    for (const t of ts) { await shot(t, `out/stills/t_${t.toFixed(2).padStart(5, '0')}.png`); console.log('still', t); }
  } else if (mode === 'sheet') {
    // node scripts/capture.mjs sheet name t1,t2,...  -> out/sheets/name.png (labelled contact sheet)
    mkdirSync('out/sheets', { recursive: true });
    const name = rest[0]; const ts = rest[1].split(',').map(Number);
    const imgs = [];
    for (const t of ts) { await page.evaluate((tt) => { window.__ascent.film.debugCam = null; window.__ascent.render(tt); }, t); imgs.push((await page.locator('canvas').first().screenshot({ type: 'png' })).toString('base64')); }
    const dataUrl = await page.evaluate(async ([imgs, ts]) => {
      const load = (b) => new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.src = 'data:image/png;base64,' + b; });
      const im = await Promise.all(imgs.map(load));
      const w = 300, h = Math.round(300 * 16 / 9);
      const c = document.createElement('canvas'); c.width = w * im.length; c.height = h; const g = c.getContext('2d');
      im.forEach((i, k) => { g.drawImage(i, k * w, 0, w, h); g.fillStyle = '#f2ebdd'; g.font = '14px monospace'; g.fillText('t=' + ts[k], k * w + 8, h - 8); });
      return c.toDataURL('image/png');
    }, [imgs, ts]);
    writeFileSync(`out/sheets/${name}.png`, Buffer.from(dataUrl.split(',')[1], 'base64'));
  } else if (mode === 'cams') {
    // node scripts/capture.mjs cams <t> "x,y,z,lx,ly,lz,fov" ["..." ...]
    mkdirSync('out/cams', { recursive: true });
    const t = +rest[0];
    for (let i = 1; i < rest.length; i++) { await shot(t, `out/cams/c_${t.toFixed(1)}_${i}.png`, rest[i].split(',').map(Number)); console.log('cam', i); }
  } else if (mode === 'loopcheck') {
    const res = await page.evaluate(async () => {
      const f = window.__ascent.film;
      const grab = (t) => { f.renderAt(t); const c = document.createElement('canvas'); c.width = f.bw; c.height = f.bh; const g = c.getContext('2d'); g.drawImage(f.renderer.domElement, 0, 0); return g.getImageData(0, 0, f.bw, f.bh).data; };
      const a = grab(0); const b = grab(35); const c = grab(34.9667); const d = grab(1 / 30);
      const diff = (x, y) => { let max = 0, sum = 0; for (let i = 0; i < x.length; i += 4) { const d = Math.max(Math.abs(x[i] - y[i]), Math.abs(x[i + 1] - y[i + 1]), Math.abs(x[i + 2] - y[i + 2])); max = Math.max(max, d); sum += d; } return { max, mean: sum / (x.length / 4) }; };
      return { t0_vs_t35: diff(a, b), 'frame1049_vs_frame0 (1 frame apart)': diff(a, c), 'frame1_vs_frame0 (1 frame apart, reference)': diff(a, d) };
    });
    console.log(JSON.stringify(res, null, 2));
  } else if (mode === 'frames') {
    mkdirSync('out/frames', { recursive: true });
    const from = +(rest[0] ?? 0); const to = +(rest[1] ?? 1049);
    for (let f = from; f <= to; f++) { await shot(f / 30, `out/frames/f_${String(f).padStart(5, '0')}.png`); if (f % 30 === 0) console.log('frame', f); }
  }
} finally {
  if (logs.length) console.log(logs.slice(0, 40).join('\n'));
  await browser.close();
  if (server) server.kill();
}
