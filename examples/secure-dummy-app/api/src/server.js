import express from "express";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { rateLimit } from "express-rate-limit";
import { z } from "zod";

import { config } from "./config.js";
import {
  SESSION_COOKIE,
  issueSession,
  requireAuth,
  sessionCookieOptions,
  verifyPassword,
} from "./auth.js";

const app = express();

// Behind exactly one proxy (nginx), so rate limiting keys off the real client
// address rather than the proxy's - otherwise every visitor shares one bucket.
//
// The value is a hop count, and express counts the socket address as hop 0.
// `1` therefore trusts exactly one hop (nginx) and resolves req.ip to the
// address nginx itself observed. Any X-Forwarded-For entry a client sends is
// left of that and is ignored, so an attacker cannot rotate a forged header to
// escape the limiter. Verified: forged XFF keeps consuming the sender's own
// budget.
//
// Do not change this to `true`, which trusts the entire chain and makes the
// left-most - fully client-controlled - entry the key. Raise the number only
// if you actually add another proxy in front of nginx.
//
// This setting is only sound because the proxy is unavoidable. If this API
// were ever published on a host port, a client could reach it directly and
// send a bare X-Forwarded-For with nothing appended, and that forged value
// would become req.ip. Keeping the `ports:` block off the api service in
// docker-compose.yml is therefore part of this control, not just tidiness.
app.set("trust proxy", 1);

// Don't advertise the framework.
app.disable("x-powered-by");

// Sensible API defaults from helmet: nosniff, no framing, referrer policy,
// cross-origin isolation. The HTML-oriented CSP is disabled because these
// responses are JSON - nginx sets the page CSP for the app itself.
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  }),
);

// Cap the request body. Without a limit, a single large POST is a trivial
// memory-exhaustion vector.
app.use(express.json({ limit: "16kb" }));
app.use(cookieParser());

// Baseline limiter for the whole API.
app.use(
  rateLimit({
    windowMs: 60_000,
    limit: 120,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: { error: "too many requests" },
  }),
);

// Login gets a much tighter budget of its own. This is what turns a password
// from guessable-in-hours into guessable-in-never: an attacker gets 5 attempts
// per 15 minutes per IP, not thousands per second.
const loginLimiter = rateLimit({
  windowMs: 15 * 60_000,
  limit: 5,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { error: "too many login attempts, try again later" },
});

// ---------------------------------------------------------------------------
// Demo data - in memory on purpose. Restarting the container resets it.
// ---------------------------------------------------------------------------
let nextId = 3;
const items = [
  { id: 1, name: "Ashwagandha Root", stock: 24 },
  { id: 2, name: "Tulsi Leaf", stock: 11 },
];

// ---------------------------------------------------------------------------
// Schemas. Every piece of client input is parsed before it is used.
// ---------------------------------------------------------------------------
const LoginSchema = z.object({
  username: z.string().min(1).max(64),
  password: z.string().min(1).max(200),
});

const NewItemSchema = z
  .object({
    name: z.string().trim().min(1).max(80),
    stock: z.number().int().min(0).max(100_000),
  })
  // Reject unexpected fields outright rather than ignoring them. This is what
  // stops a client from smuggling `{"name":"x","stock":1,"isAdmin":true}` into
  // an object that later gets spread somewhere trusting.
  .strict();

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.post("/api/login", loginLimiter, (req, res) => {
  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "invalid request body" });
  }

  const { username, password } = parsed.data;
  const userMatches = username === config.DEMO_USER;
  // Always run the hash comparison, even when the username is wrong. Returning
  // early on an unknown user makes the response measurably faster and lets an
  // attacker enumerate valid usernames by timing alone.
  const passwordMatches = verifyPassword(password, config.DEMO_PASSWORD_HASH);

  if (!userMatches || !passwordMatches) {
    // One generic message for both cases - never "no such user" vs
    // "wrong password", which hands over half the credential.
    return res.status(401).json({ error: "invalid credentials" });
  }

  res.cookie(SESSION_COOKIE, issueSession(username), sessionCookieOptions);
  res.json({ user: username });
});

app.post("/api/logout", (_req, res) => {
  res.clearCookie(SESSION_COOKIE, { ...sessionCookieOptions, maxAge: undefined });
  res.status(204).end();
});

app.get("/api/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});

// Public read.
app.get("/api/items", (_req, res) => {
  res.json({ items });
});

// Authenticated write.
app.post("/api/items", requireAuth, (req, res) => {
  const parsed = NewItemSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "invalid item",
      // Field paths and messages only - never the raw input echoed back.
      details: parsed.error.issues.map((i) => ({
        field: i.path.join("."),
        message: i.message,
      })),
    });
  }

  const item = { id: nextId++, ...parsed.data };
  items.push(item);
  res.status(201).json({ item });
});

app.use((_req, res) => {
  res.status(404).json({ error: "not found" });
});

// Central error handler. Logs the detail server-side, returns none of it.
// Stack traces in an HTTP response are a free map of the application.
app.use((err, _req, res, _next) => {
  // Body-parser signals malformed JSON and oversized payloads by attaching a
  // 4xx status to the error. Those are the client's fault and must be reported
  // as such - collapsing them into 500 hides a rejected request behind what
  // looks like a server crash.
  const status = Number(err?.status ?? err?.statusCode);
  if (Number.isInteger(status) && status >= 400 && status < 500) {
    // One line, no stack. A flood of malformed requests should not be able to
    // fill the disk with traces.
    console.warn(`client error ${status}: ${err.type ?? err.message}`);
    return res.status(status).json({ error: "invalid request" });
  }

  console.error("unhandled error:", err);
  res.status(500).json({ error: "internal server error" });
});

const server = app.listen(config.PORT, () => {
  console.log(`api listening on :${config.PORT}`);
});

// Containers stop with SIGTERM. Without this, Docker waits the full timeout
// and then kills the process, dropping in-flight requests.
for (const signal of ["SIGTERM", "SIGINT"]) {
  process.on(signal, () => {
    console.log(`${signal} received, shutting down`);
    server.close(() => process.exit(0));
  });
}

export { app };
