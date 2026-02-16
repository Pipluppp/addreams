# 02 — Authentication: better-auth + Hono + Cloudflare Workers

> Updated after verification against [better-auth Hono docs](https://www.better-auth.com/docs/integrations/hono), [Hono CF example](https://hono.dev/examples/better-auth-on-cloudflare), and [better-auth CF Workers section](https://www.better-auth.com/docs/integrations/hono#cloudflare-workers).

## Architecture

```
┌─────────────┐     cookie      ┌──────────────────┐      D1
│  React SPA  │ ◄─────────────► │  Hono Worker API │ ◄──────► D1 (sessions, users)
│  (frontend) │   /api/auth/*   │    (backend)      │
│             │                 │                    │
│ authClient  │  same-origin    │  createAuth(env)   │
│  baseURL="" │  via proxy      │  (factory pattern) │
└─────────────┘                 └──────────────────┘
```

- **Frontend** uses `better-auth/react` client — requests go through the frontend worker proxy (`/api/*` → backend), so everything is same-origin.
- **Backend** creates `betterAuth()` instance per-request (factory pattern) because D1 bindings aren't available at module scope in Workers.
- **Sessions** are cookie-based. Cookie cache enabled to reduce D1 reads.
- **No email verification** — users get immediate access on sign-up.

## Why Factory Pattern?

Cloudflare Workers provide `env` (with D1, secrets) only inside the `fetch()` handler or Hono context. You **cannot** create a static auth instance at module scope:

```typescript
// WRONG — env.DB is undefined at module scope in Workers
const db = drizzle(env.DB);
export const auth = betterAuth({ ... });
```

The factory pattern creates a fresh instance per request. This is cheap — better-auth doesn't have heavy initialization.

> **Alternative approaches exist** (`import { env } from "cloudflare:workers"` or `nodejs_compat_populate_process_env` flag), but the factory pattern is the most explicit, testable, and widely documented approach.

## Backend: Static Auth Options

Separate static config from runtime config. This file has no `env` dependency and can be imported by CLI tools if needed.

### `backend/src/auth/options.ts`

```typescript
import type { BetterAuthOptions } from "better-auth";

/**
 * Static better-auth options that don't depend on runtime env.
 * Runtime-dependent options (database, secret, URLs) are added in the factory.
 */
export const betterAuthOptions = {
  basePath: "/api/auth",
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
} satisfies Partial<BetterAuthOptions>;
```

## Backend: `createAuth()` Factory

### `backend/src/auth/index.ts`

```typescript
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "../db/schema";
import { betterAuthOptions } from "./options";

export function createAuth(env: WorkerBindings) {
  const db = drizzle(env.DB, { schema });

  return betterAuth({
    ...betterAuthOptions,

    database: drizzleAdapter(db, {
      provider: "sqlite",
    }),

    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    trustedOrigins: env.BETTER_AUTH_TRUSTED_ORIGINS.split(","),

    socialProviders: {
      google: {
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
      },
      github: {
        clientId: env.GITHUB_CLIENT_ID,
        clientSecret: env.GITHUB_CLIENT_SECRET,
      },
    },

    session: {
      expiresIn: 60 * 60 * 24 * 7, // 7 days
      updateAge: 60 * 60 * 24,      // Refresh after 1 day
      cookieCache: {
        enabled: true,
        maxAge: 5 * 60, // Cache session in cookie for 5 min to reduce D1 reads
      },
    },

    advanced: {
      cookiePrefix: "addreams",
      defaultCookieAttributes: {
        sameSite: "lax",
        secure: true,
        httpOnly: true,
      },
    },
  });
}

export type Auth = ReturnType<typeof createAuth>;
```

### `basePath` is critical

`basePath: "/api/auth"` tells better-auth where its routes are mounted. This affects:
- Generated OAuth callback URLs (`/api/auth/callback/google`)
- Internal route matching
- Client-side URL generation

It **must** match the Hono route pattern: `app.on(["GET","POST"], "/api/auth/*", ...)`.

## Backend: Auth Routes in Hono

### `backend/src/index.ts`

```typescript
import { Hono } from "hono";
import { cors } from "hono/cors";
import { createAuth } from "./auth";
import { authMiddleware } from "./auth/middleware";
import { getMigrations } from "better-auth/db";

const app = new Hono<{ Bindings: WorkerBindings }>();

// ── CORS (must be before auth routes) ──────────────────────
app.use("/api/*", cors({
  origin: (origin, c) => {
    const trusted = c.env.BETTER_AUTH_TRUSTED_ORIGINS.split(",");
    return trusted.includes(origin) ? origin : null;
  },
  allowHeaders: ["Content-Type", "Authorization"],
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true,
}));

// ── Public routes ──────────────────────────────────────────
app.get("/api/health", (c) => c.json({ status: "ok" }));

// ── Auth routes (better-auth handles all /api/auth/* endpoints) ──
app.on(["GET", "POST"], "/api/auth/*", (c) => {
  const auth = createAuth(c.env);
  return auth.handler(c.req.raw);
});

// ── Programmatic migration endpoint (protect or remove after setup) ──
app.post("/api/migrate", async (c) => {
  const { toBeCreated, toBeAdded, runMigrations } = await getMigrations({
    database: c.env.DB,  // Pass D1 binding directly — better-auth uses built-in Kysely adapter
  });

  if (toBeCreated.length === 0 && toBeAdded.length === 0) {
    return c.json({ message: "No migrations needed" });
  }

  await runMigrations();

  return c.json({
    message: "Migrations completed",
    tablesCreated: toBeCreated.map((t) => t.table),
    columnsAdded: toBeAdded.map((t) => t.table),
  });
});

// ── Protected routes ───────────────────────────────────────
app.get("/api/me", authMiddleware, (c) => {
  return c.json({ user: c.get("user"), session: c.get("session") });
});

app.use("/api/workflows/*", authMiddleware);
app.use("/api/generations/*", authMiddleware);

// ... route mounts for workflows and generations
```

### Programmatic Migrations — How It Works

The `getMigrations()` function from `better-auth/db` accepts a D1 binding **directly** (no Drizzle adapter needed — it uses better-auth's built-in Kysely adapter internally). It:

1. Inspects the database for existing tables
2. Compares against better-auth's expected schema
3. Returns `toBeCreated` (new tables) and `toBeAdded` (new columns)
4. `runMigrations()` executes the DDL

This completely sidesteps the CLI import problem. The endpoint should be removed or protected after initial setup.

### better-auth Auto-Registered Endpoints

better-auth handles these routes under `/api/auth/`:

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/sign-up/email` | Email/password registration |
| POST | `/api/auth/sign-in/email` | Email/password login |
| POST | `/api/auth/sign-out` | Sign out (clear session) |
| GET | `/api/auth/session` | Get current session |
| GET | `/api/auth/sign-in/social` | Initiate OAuth flow |
| GET | `/api/auth/callback/:provider` | OAuth callback handler |
| POST | `/api/auth/forget-password` | Request password reset |
| POST | `/api/auth/reset-password` | Reset password with token |
| POST | `/api/auth/change-password` | Change password (authenticated) |
| POST | `/api/auth/update-user` | Update user profile |
| POST | `/api/auth/delete-user` | Delete user account |

## Backend: Auth Middleware

### `backend/src/auth/middleware.ts`

```typescript
import { createMiddleware } from "hono/factory";
import { createAuth } from "./index";

type AuthSession = {
  user: {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
    image: string | null;
    createdAt: Date;
    updatedAt: Date;
  };
  session: {
    id: string;
    userId: string;
    token: string;
    expiresAt: Date;
    ipAddress: string | null;
    userAgent: string | null;
  };
};

/**
 * Requires authenticated session. Returns 401 if not authenticated.
 */
export const authMiddleware = createMiddleware<{
  Bindings: WorkerBindings;
  Variables: {
    user: AuthSession["user"];
    session: AuthSession["session"];
  };
}>(async (c, next) => {
  const auth = createAuth(c.env);
  const result = await auth.api.getSession({
    headers: c.req.raw.headers,
  });

  if (!result) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  c.set("user", result.user);
  c.set("session", result.session);
  await next();
});

/**
 * Optional auth — sets user/session if available, but does not reject.
 */
export const optionalAuthMiddleware = createMiddleware<{
  Bindings: WorkerBindings;
  Variables: {
    user: AuthSession["user"] | null;
    session: AuthSession["session"] | null;
  };
}>(async (c, next) => {
  const auth = createAuth(c.env);
  const result = await auth.api.getSession({
    headers: c.req.raw.headers,
  });

  c.set("user", result?.user ?? null);
  c.set("session", result?.session ?? null);
  await next();
});
```

## Frontend: Auth Client

### `frontend/src/lib/auth-client.ts`

```typescript
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  // Empty baseURL = same origin (frontend worker proxies /api/* to backend)
  baseURL: "",
  fetchOptions: {
    credentials: "include",
  },
});

export const { signIn, signUp, signOut, useSession, getSession } = authClient;
```

**Why empty `baseURL`?** The frontend worker already proxies `/api/*` to the backend. This means:
- Auth cookies are same-origin — no CORS issues
- `sameSite: lax` works perfectly
- No need for `credentials: "include"` in theory (same origin), but kept for safety

## OAuth Provider Setup

### Google

1. [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials → Create OAuth 2.0 Client ID
2. Authorized redirect URIs:
   - Local: `http://localhost:8787/api/auth/callback/google`
   - Production: `https://addreams-api.duncanb013.workers.dev/api/auth/callback/google`
3. Copy Client ID + Secret → `.dev.vars` + `wrangler secret put`

### GitHub

1. [GitHub Developer Settings](https://github.com/settings/developers) → OAuth Apps → New
2. Homepage URL: `https://addreams-web.duncanb013.workers.dev`
3. Authorization callback URL:
   - Local: `http://localhost:8787/api/auth/callback/github`
   - Production: `https://addreams-api.duncanb013.workers.dev/api/auth/callback/github`
4. Copy Client ID + Secret → `.dev.vars` + `wrangler secret put`

## User Profile Creation Hook

When a new user signs up, we need to create a `user_profile` row with default credits. Use better-auth's `user.create` hook (or handle it in application code after first login). See [03-schema.md](./03-schema.md) for the `user_profile` table.

```typescript
// In createAuth() config — add after the database config:
user: {
  create: {
    after: async (user, ctx) => {
      // Create user_profile with default free credits
      const db = drizzle(ctx.env.DB, { schema });
      await db.insert(schema.userProfile).values({
        userId: user.id,
        accountType: "free",
        creditsProductShoots: 1,
        creditsAdGraphics: 1,
      });
    },
  },
},
```

> **Note:** Verify the exact hook API in better-auth docs — the `ctx` shape may differ. Alternative: create the profile row in the workflow handler on first use (check if profile exists, create if not).
