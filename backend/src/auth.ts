import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { createDb } from "./db";
import * as schema from "./db/schema";

type AuthEnv = {
  DB: D1Database;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
  TRUSTED_ORIGINS?: string;
};

const SCRYPT_OPTIONS = {
  N: 16384,
  r: 16,
  p: 1,
  maxmem: 128 * 16384 * 16 * 2,
} as const;

function hashPasswordWithScrypt(password: string): string {
  const normalizedPassword = password.normalize("NFKC");
  const salt = randomBytes(16).toString("hex");
  const key = scryptSync(normalizedPassword, salt, 64, SCRYPT_OPTIONS).toString("hex");
  return `${salt}:${key}`;
}

function verifyPasswordWithScrypt(hash: string, password: string): boolean {
  const [salt, keyHex] = hash.split(":");
  if (!salt || !keyHex) return false;

  const normalizedPassword = password.normalize("NFKC");
  const expectedKey = scryptSync(normalizedPassword, salt, 64, SCRYPT_OPTIONS);
  const key = Buffer.from(keyHex, "hex");
  if (key.length !== expectedKey.length) return false;

  return timingSafeEqual(expectedKey, key);
}

export function createAuth(env: AuthEnv) {
  const db = createDb(env.DB);

  return betterAuth({
    database: drizzleAdapter(db, { provider: "sqlite", schema }),
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    basePath: "/api/auth",
    trustedOrigins: env.TRUSTED_ORIGINS?.split(",").map((s) => s.trim()) ?? [],
    session: {
      expiresIn: 60 * 60 * 24 * 7, // 7 days
      cookieCache: { enabled: true, maxAge: 5 * 60 },
    },
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
      password: {
        hash: async (password) => hashPasswordWithScrypt(password),
        verify: async ({ hash, password }) => verifyPasswordWithScrypt(hash, password),
      },
    },
  });
}

export type Auth = ReturnType<typeof createAuth>;
