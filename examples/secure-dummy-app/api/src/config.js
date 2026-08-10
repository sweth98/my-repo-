import { z } from "zod";

// Validate configuration at boot and crash immediately if anything is missing.
//
// This is a security control, not tidiness. The classic failure is a server
// that starts with `SESSION_SECRET || "dev-secret"` and quietly signs
// production cookies with a value that is published in the source. There is no
// fallback anywhere in this schema: misconfiguration stops the process instead
// of silently degrading into something forgeable.
const EnvSchema = z.object({
  // 32 bytes of entropy, hex-encoded. Generate with:
  //   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  SESSION_SECRET: z
    .string()
    .min(32, "SESSION_SECRET must be at least 32 characters"),

  DEMO_USER: z.string().min(1).default("demo"),

  // scrypt output as "salt:hash", both hex. Never a plaintext password.
  // Generate with: npm run hash-password -- 'your-password'
  DEMO_PASSWORD_HASH: z
    .string()
    .regex(
      /^[0-9a-f]{32}:[0-9a-f]{128}$/,
      "DEMO_PASSWORD_HASH must be 'salt:hash' hex from `npm run hash-password`",
    ),

  PORT: z.coerce.number().int().min(1).max(65535).default(3000),

  // Marks the session cookie Secure. Must be true anywhere real TLS is in
  // play; false only so the demo works over plain http://localhost.
  COOKIE_SECURE: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true"),

  SESSION_TTL_SECONDS: z.coerce.number().int().positive().default(3600),
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid configuration - refusing to start:");
  for (const issue of parsed.error.issues) {
    console.error(`  ${issue.path.join(".") || "(root)"}: ${issue.message}`);
  }
  process.exit(1);
}

export const config = parsed.data;
