// Render every frame of the animation deterministically and write it to disk.
//
//   node capture.mjs [outDir] [fps]
//
// The page exposes window.__setTime(t), which positions the whole scene as a
// pure function of t and renders one frame. Nothing is driven by
// requestAnimationFrame or wall-clock time, so the output is identical on
// every run regardless of how fast the machine is - which is the only way to
// get a stable frame rate out of a headless browser.

import pw from "playwright";
import { mkdir, rm } from "node:fs/promises";

const { chromium } = pw;
const OUT = process.argv[2] || "./frames";
const FPS = Number(process.argv[3] || 30);

await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });

// swiftshader gives WebGL a software rasteriser, so this renders on a
// headless machine with no GPU. CHROMIUM_PATH lets you point at a browser
// that is already on disk instead of downloading one.
const browser = await chromium.launch({
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
  ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}),
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));

await page.goto("http://127.0.0.1:4190/scene.html", { waitUntil: "load" });
await page.waitForFunction(() => window.__ready === true, { timeout: 30000 });

const { T_END } = await page.evaluate(() => window.__meta);
const total = Math.round(T_END * FPS);
const started = Date.now();

for (let i = 0; i < total; i++) {
  await page.evaluate((t) => window.__setTime(t), i / FPS);
  await page.screenshot({
    path: `${OUT}/${String(i).padStart(5, "0")}.png`,
    animations: "disabled",
  });
  if (i % 60 === 0) {
    const pct = ((i / total) * 100).toFixed(0);
    const secs = ((Date.now() - started) / 1000).toFixed(0);
    console.log(`  ${pct}%  frame ${i}/${total}  (${secs}s)`);
  }
}

console.log(`done: ${total} frames in ${((Date.now() - started) / 1000).toFixed(0)}s`);
console.log("errors:", errors.length ? errors.slice(0, 5) : "none");
await browser.close();
