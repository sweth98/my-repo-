// Generate a scrypt hash for DEMO_PASSWORD_HASH.
//
//   npm run hash-password -- 'your-password-here'
//
// Quote the password so the shell doesn't expand it, and remember that a
// password typed as a shell argument lands in your shell history.

import crypto from "node:crypto";

const password = process.argv[2];

if (!password) {
  console.error("usage: npm run hash-password -- '<password>'");
  process.exit(1);
}

if (password.length < 12) {
  console.error("refusing: use at least 12 characters");
  process.exit(1);
}

const salt = crypto.randomBytes(16);
const hash = crypto.scryptSync(password, salt, 64);

console.log(`${salt.toString("hex")}:${hash.toString("hex")}`);
