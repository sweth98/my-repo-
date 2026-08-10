// End-to-end check of the API's security controls.
//
//   npm run smoke
//
// Boots the server on a scratch port with throwaway credentials and asserts
// that each control actually behaves as intended. These are the assertions
// that would catch a regression such as "auth middleware accidentally removed"
// or "strict schema loosened".

import { spawn } from "node:child_process";
import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const apiRoot = path.resolve(here, "..");

const PORT = 3999;
const BASE = `http://127.0.0.1:${PORT}`;
const PASSWORD = "correct-horse-battery-staple";

const salt = crypto.randomBytes(16);
const hash = crypto.scryptSync(PASSWORD, salt, 64);

const env = {
  ...process.env,
  PORT: String(PORT),
  SESSION_SECRET: crypto.randomBytes(32).toString("hex"),
  DEMO_USER: "demo",
  DEMO_PASSWORD_HASH: `${salt.toString("hex")}:${hash.toString("hex")}`,
  COOKIE_SECURE: "false",
};

let passed = 0;
const failures = [];

function check(name, condition, detail = "") {
  if (condition) {
    passed++;
    console.log(`  PASS  ${name}`);
  } else {
    failures.push(`${name}${detail ? ` - ${detail}` : ""}`);
    console.log(`  FAIL  ${name}${detail ? ` - ${detail}` : ""}`);
  }
}

async function waitForServer(timeoutMs = 15000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${BASE}/api/health`);
      if (res.ok) return true;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 150));
  }
  return false;
}

// --- boot-time config validation, in its own process -----------------------
async function checkFailsWithoutSecret() {
  return new Promise((resolve) => {
    const bad = { ...env };
    delete bad.SESSION_SECRET;
    const child = spawn(process.execPath, ["src/server.js"], {
      cwd: apiRoot,
      env: { ...bad, PORT: "3998" },
      stdio: ["ignore", "ignore", "pipe"],
    });
    let stderr = "";
    child.stderr.on("data", (d) => (stderr += d));
    child.on("exit", (code) => {
      check(
        "refuses to boot without SESSION_SECRET",
        code === 1 && /SESSION_SECRET/.test(stderr),
        `exit=${code}`,
      );
      resolve();
    });
  });
}

async function main() {
  console.log("\nconfiguration");
  await checkFailsWithoutSecret();

  const server = spawn(process.execPath, ["src/server.js"], {
    cwd: apiRoot,
    env,
    stdio: ["ignore", "pipe", "pipe"],
  });
  server.stderr.on("data", (d) => process.stderr.write(`  [api] ${d}`));

  try {
    if (!await waitForServer()) throw new Error("server never became healthy");

    console.log("\npublic surface");
    const health = await fetch(`${BASE}/api/health`);
    check("GET /api/health is 200", health.status === 200);
    check(
      "X-Powered-By header is suppressed",
      health.headers.get("x-powered-by") === null,
    );
    check(
      "nosniff header present",
      health.headers.get("x-content-type-options") === "nosniff",
    );

    const list = await fetch(`${BASE}/api/items`);
    const listBody = await list.json();
    check(
      "GET /api/items is public and returns seed data",
      list.status === 200 && listBody.items.length === 2,
    );

    const missing = await fetch(`${BASE}/api/nope`);
    check("unknown route returns JSON 404", missing.status === 404);

    console.log("\nauthentication");
    const noAuth = await fetch(`${BASE}/api/items`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "Sneaky", stock: 1 }),
    });
    check("POST /api/items without session is 401", noAuth.status === 401);

    check(
      "GET /api/me without session is 401",
      (await fetch(`${BASE}/api/me`)).status === 401,
    );

    const wrongPw = await fetch(`${BASE}/api/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ username: "demo", password: "wrong" }),
    });
    const wrongBody = await wrongPw.json();
    check("login with wrong password is 401", wrongPw.status === 401);
    check(
      "login error message does not distinguish user vs password",
      wrongBody.error === "invalid credentials",
      wrongBody.error,
    );

    const login = await fetch(`${BASE}/api/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ username: "demo", password: PASSWORD }),
    });
    check("login with correct password is 200", login.status === 200);

    const setCookie = login.headers.get("set-cookie") ?? "";
    check("session cookie is HttpOnly", /HttpOnly/i.test(setCookie), setCookie);
    check(
      "session cookie is SameSite=Strict",
      /SameSite=Strict/i.test(setCookie),
      setCookie,
    );

    const cookie = setCookie.split(";")[0];
    const me = await fetch(`${BASE}/api/me`, { headers: { cookie } });
    check("GET /api/me with session is 200", me.status === 200);
    check("session resolves to the right user", (await me.json()).user === "demo");

    console.log("\nsession integrity");
    const [encoded, sig] = cookie.split("=")[1].split(".");
    const forgedPayload = Buffer.from(
      JSON.stringify({ sub: "admin", exp: Math.floor(Date.now() / 1000) + 999 }),
    ).toString("base64url");
    const forged = `sid=${forgedPayload}.${sig}`;
    check(
      "tampered session payload is rejected",
      (await fetch(`${BASE}/api/me`, { headers: { cookie: forged } })).status === 401,
    );
    check(
      "truncated session token is rejected",
      (await fetch(`${BASE}/api/me`, { headers: { cookie: `sid=${encoded}` } }))
        .status === 401,
    );

    console.log("\ninput validation");
    const good = await fetch(`${BASE}/api/items`, {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({ name: "Brahmi", stock: 7 }),
    });
    check("authenticated valid POST is 201", good.status === 201);

    const extra = await fetch(`${BASE}/api/items`, {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({ name: "Evil", stock: 1, isAdmin: true }),
    });
    check("unexpected field is rejected (strict schema)", extra.status === 400);

    const badType = await fetch(`${BASE}/api/items`, {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({ name: "Bad", stock: "lots" }),
    });
    check("wrong field type is rejected", badType.status === 400);

    const negative = await fetch(`${BASE}/api/items`, {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({ name: "Neg", stock: -5 }),
    });
    check("out-of-range value is rejected", negative.status === 400);

    const huge = await fetch(`${BASE}/api/items`, {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({ name: "x".repeat(200_000), stock: 1 }),
    });
    check("oversized body is rejected", huge.status === 413 || huge.status === 400,
      `status=${huge.status}`);

    console.log("\nrate limiting");
    let sawLimit = false;
    let limitedAfter = 0;
    for (let i = 0; i < 10; i++) {
      const r = await fetch(`${BASE}/api/login`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username: "demo", password: "guess" }),
      });
      if (r.status === 429) {
        sawLimit = true;
        limitedAfter = i + 1;
        break;
      }
    }
    check("brute-force login is rate limited", sawLimit,
      sawLimit ? `429 after ${limitedAfter} attempts` : "never limited");

    // The budget for this source address is now spent. A client that rotates a
    // forged X-Forwarded-For must NOT get a fresh bucket - if it does, the
    // limiter keys on client-controlled input and protects nothing. This is
    // what regresses if `trust proxy` is changed to `true`.
    //
    // The header below is shaped the way nginx's $proxy_add_x_forwarded_for
    // builds it: whatever the client sent, followed by the address nginx
    // actually observed. That trailing entry is the one `trust proxy: 1`
    // resolves to, which is what makes the forgery inert.
    //
    // NOTE: this test talks to the API directly. Sending a bare forged header
    // with no appended hop WOULD win here, because nothing overwrote it - which
    // is exactly why the API is given no published port in docker-compose.yml
    // and is reachable only through the proxy.
    const observedByProxy = "127.0.0.1";
    let escaped = false;
    for (const forged of ["1.2.3.4", "5.6.7.8", "9.10.11.12"]) {
      const r = await fetch(`${BASE}/api/login`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-forwarded-for": `${forged}, ${observedByProxy}`,
        },
        body: JSON.stringify({ username: "demo", password: "guess" }),
      });
      if (r.status !== 429) {
        escaped = true;
        break;
      }
    }
    check("forged X-Forwarded-For cannot reset the limit", !escaped);
  } finally {
    server.kill("SIGTERM");
  }

  console.log(`\n${passed} passed, ${failures.length} failed`);
  if (failures.length) {
    console.log("\nfailures:");
    for (const f of failures) console.log(`  - ${f}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
