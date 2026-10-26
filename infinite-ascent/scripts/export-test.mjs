// Runs the in-browser exporter headlessly at reduced size (pipeline test).
import { createRequire } from 'module';
import { writeFileSync, mkdirSync } from 'fs';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const W = +(process.env.EW || 270), H = Math.round(W * 16 / 9);
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage({ viewport: { width: 540, height: 960 }, acceptDownloads: true });
page.on('console', (m) => console.log('[page]', m.text()));
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
await page.goto(`http://localhost:${process.env.PORT || 5173}/?export&paused&shadow=2048&samples=0`);
await page.waitForFunction(() => window.__ascent?.exportVideo, null, { timeout: 120000 });
mkdirSync('out/export', { recursive: true });
const downloads = [];
page.on('download', async (d) => { const p = `out/export/${d.suggestedFilename()}`; await d.saveAs(p); downloads.push(p); });
const t0 = Date.now();
const res = await page.evaluate(async ([w, h, br]) => {
  const r = await window.__ascent.exportVideo({ width: w, height: h, bitrate: br });
  return { codec: r.codec, audio: r.audio, bytes: r.blob.size };
}, [W, H, +(process.env.BR || 3e6)]);
await new Promise((r) => setTimeout(r, 1500));
console.log(JSON.stringify(res), 'seconds', (Date.now() - t0) / 1000, downloads);
await browser.close();
