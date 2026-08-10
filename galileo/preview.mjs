import pw from "playwright";
const { chromium } = pw;
const OUT = process.argv[2] || ".";
const times = (process.argv[3] || "0,5,8,13,17,21").split(",").map(Number);

const b = await chromium.launch({
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
  ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}),
});
const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
const errs = [];
p.on("pageerror", (e) => errs.push(e.message));
p.on("console", (m) => m.type() === "error" && errs.push(m.text()));

await p.goto("http://127.0.0.1:4190/scene.html", { waitUntil: "load" });
await p.waitForFunction(() => window.__ready === true, { timeout: 20000 });
console.log("meta:", JSON.stringify(await p.evaluate(() => window.__meta)));

for (const t of times) {
  await p.evaluate((tt) => window.__setTime(tt), t);
  await p.waitForTimeout(120);
  await p.screenshot({ path: `${OUT}/t${String(t).padStart(2, "0")}.png` });
}
console.log("errors:", errs.length ? errs : "none");
await b.close();
