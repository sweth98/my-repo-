// Deterministic offline render: seeks the GSAP timeline frame-by-frame in headless Chromium,
// renders the procedural soundtrack with OfflineAudioContext, and muxes with ffmpeg.
// Usage: node render.mjs [--fmt h|v] [--url http://127.0.0.1:5174] [--out out.mp4] [--workers 4] [--fps 30]
import { createRequire } from 'module'; import { execFileSync } from 'child_process';
const { chromium } = createRequire(import.meta.url)('playwright'); // resolves local or global (NODE_PATH) install
 import fs from 'fs'; import path from 'path';
const a = Object.fromEntries(process.argv.slice(2).reduce((r, x, i, arr) => (x.startsWith('--') ? [...r, [x.slice(2), arr[i + 1]]] : r), []));
const fmt = a.fmt || 'h', url = a.url || 'http://127.0.0.1:5174', fps = +(a.fps || 30), N = +(a.workers || 4), out = a.out || `from-bean-to-brew-${fmt === 'v' ? '9x16' : '16x9'}.mp4`;
const V = fmt === 'v', vw = V ? 1080 : 1920, vh = V ? 1920 : 1080, frames = Math.round(60 * fps), dir = fs.mkdtempSync(path.join(process.env.TMPDIR || '/tmp', 'frames-'));
const launch = () => chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
async function open(b) { const p = await b.newPage({ viewport: { width: vw, height: vh } }); await p.goto(`${url}/?clean=1${V ? '&fmt=v' : ''}`); await p.waitForFunction(() => window.__ready && window.__seek, null, { timeout: 120000 }); await p.waitForTimeout(1500); return p; }
const t0 = Date.now(); let done = 0;
await Promise.all(Array.from({ length: N }, async (_, w) => { const b = await launch(), p = await open(b), el = p.locator('.stageWrap');
  for (let f = w; f < frames; f += N) { await p.evaluate((t) => window.__seek(t), f / fps); await el.screenshot({ path: `${dir}/f${String(f).padStart(5, '0')}.jpg`, type: 'jpeg', quality: 93 }); if (++done % 90 === 0) console.log(`${done}/${frames} frames, ${((Date.now() - t0) / 1000).toFixed(0)}s`); } await b.close(); }));
const b = await launch(), p = await open(b); const b64 = await p.evaluate(() => window.__audioWavB64()); fs.writeFileSync(`${dir}/audio.wav`, Buffer.from(b64, 'base64')); await b.close();
execFileSync('ffmpeg', ['-y', '-v', 'error', '-framerate', String(fps), '-i', `${dir}/f%05d.jpg`, '-i', `${dir}/audio.wav`, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-preset', 'medium', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', out]);
console.log('wrote', out, `(${((Date.now() - t0) / 1000).toFixed(0)}s)`); fs.rmSync(dir, { recursive: true, force: true });
