import crypto from "node:crypto";
import { config } from "./config.js";

const SCRYPT_KEYLEN = 64;

/**
 * Hash a password with scrypt. Returns "salt:hash", both hex.
 *
 * scrypt is deliberately slow and memory-hard, so a leaked hash resists
 * offline brute force. Never store a plain SHA-256 of a password - a GPU
 * tries billions of those per second.
 */
export function hashPassword(password, salt = crypto.randomBytes(16)) {
  const derived = crypto.scryptSync(password, salt, SCRYPT_KEYLEN);
  return `${salt.toString("hex")}:${derived.toString("hex")}`;
}

/**
 * Compare a candidate password against a stored "salt:hash".
 *
 * Uses timingSafeEqual rather than `===`. A normal string comparison returns
 * as soon as it hits a differing byte, and that timing difference is
 * measurable over a network - it leaks the secret one byte at a time.
 */
export function verifyPassword(password, stored) {
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;

  const expected = Buffer.from(hashHex, "hex");
  const actual = crypto.scryptSync(
    password,
    Buffer.from(saltHex, "hex"),
    SCRYPT_KEYLEN,
  );

  if (expected.length !== actual.length) return false;
  return crypto.timingSafeEqual(expected, actual);
}

function sign(value) {
  return crypto
    .createHmac("sha256", config.SESSION_SECRET)
    .update(value)
    .digest("base64url");
}

/**
 * Issue a stateless session token: base64url(payload).hmac
 *
 * The payload is readable by the client - that is fine, it holds no secret.
 * What matters is that it is not *forgeable*: without SESSION_SECRET an
 * attacker cannot produce a matching HMAC, so they cannot promote themselves
 * to another user or extend their own expiry.
 */
export function issueSession(username) {
  const payload = {
    sub: username,
    exp: Math.floor(Date.now() / 1000) + config.SESSION_TTL_SECONDS,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encoded}.${sign(encoded)}`;
}

/** Verify a session token. Returns the username, or null if invalid/expired. */
export function readSession(token) {
  if (typeof token !== "string") return null;

  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;

  // Verify the signature BEFORE parsing the payload. Parsing attacker-supplied
  // data that has not been authenticated is how deserialization bugs start.
  const expected = Buffer.from(sign(encoded));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length) return null;
  if (!crypto.timingSafeEqual(expected, actual)) return null;

  let payload;
  try {
    payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
  } catch {
    return null;
  }

  if (typeof payload?.exp !== "number" || payload.exp < Date.now() / 1000) {
    return null;
  }
  return typeof payload.sub === "string" ? payload.sub : null;
}

export const SESSION_COOKIE = "sid";

export const sessionCookieOptions = {
  // Unreadable from JavaScript, so an XSS bug cannot exfiltrate the session.
  httpOnly: true,
  // Not sent on cross-site requests - this is the CSRF defence.
  sameSite: "strict",
  // HTTPS-only. Configurable purely so the demo runs on plain localhost.
  secure: config.COOKIE_SECURE,
  path: "/",
  maxAge: config.SESSION_TTL_SECONDS * 1000,
};

/** Express middleware: reject the request unless a valid session is present. */
export function requireAuth(req, res, next) {
  const user = readSession(req.cookies?.[SESSION_COOKIE]);
  if (!user) {
    return res.status(401).json({ error: "authentication required" });
  }
  req.user = user;
  next();
}
