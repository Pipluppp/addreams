# 08 — Research Findings & Verification Log

Findings from verifying the implementation plan against official documentation.

## Sources Reviewed

1. [Cloudflare D1 Get Started](https://developers.cloudflare.com/d1/get-started/)
2. [Cloudflare D1 Local Development Best Practices](https://developers.cloudflare.com/d1/best-practices/local-development/)
3. [Hono + better-auth Example](https://hono.dev/examples/better-auth)
4. [Hono + better-auth on Cloudflare](https://hono.dev/examples/better-auth-on-cloudflare)
5. [better-auth Hono Integration (incl. Cloudflare Workers section)](https://www.better-auth.com/docs/integrations/hono)
6. [better-auth-cloudflare Plugin](https://github.com/zpg6/better-auth-cloudflare)
7. [Drizzle ORM + Cloudflare D1](https://orm.drizzle.team/docs/connect-cloudflare-d1)

---

## D1 Findings

### Confirmed
- `wrangler d1 create <name>` creates the database and outputs the `database_id`
- Binding config is `d1_databases` array in `wrangler.jsonc`
- Local dev uses `--local` flag; **omitting `--local` defaults to remote/production** (critical gotcha)
- Local data persists across `wrangler dev` restarts by default (Wrangler v3+)
- `wrangler d1 migrations apply <name> --local` / `--remote` for applying migrations

### Corrections to Original Plan
- **`migrations_dir` in wrangler config must match Drizzle's `out` directory.** Originally we had `"drizzle/migrations"` in wrangler and `"./drizzle/migrations"` in drizzle config. Should be consistent, e.g., both `"drizzle"`.
- **No `NO_D1_WARNING=true`** env var needed unless running in test scripts

---

## better-auth + Hono + Cloudflare Workers Findings

### Confirmed
- Factory pattern is the recommended approach for Workers
- `auth.handler(c.req.raw)` passes the raw Web Request — no adapter needed
- CORS must be registered **before** auth routes
- `credentials: true` required in CORS config

### Critical Corrections

1. **`basePath` must be explicitly set.** If auth routes are at `/api/auth/*`, better-auth config needs `basePath: "/api/auth"`. Without this, better-auth generates incorrect callback URLs for OAuth.

2. **Three solutions for CLI problem — we chose programmatic migrations:**

   **Solution 1: Programmatic Migrations (CHOSEN)**
   ```typescript
   import { getMigrations } from "better-auth/db";

   app.post("/api/migrate", async (c) => {
     const { runMigrations } = await getMigrations({
       database: c.env.DB, // Pass D1 binding directly
     });
     await runMigrations();
     return c.json({ success: true });
   });
   ```
   - better-auth can accept D1 binding **directly** as `database` (built-in Kysely adapter)
   - No Drizzle adapter needed for migrations — only for our custom queries
   - Remove/protect endpoint after initial setup

   **Solution 2: `cloudflare:workers` Module** (alternative)
   ```typescript
   import { env } from "cloudflare:workers";
   const auth = betterAuth({ database: drizzle(env.DB) });
   ```
   - Allows static instance at module scope
   - But may have issues with CLI tools outside Workers runtime

   **Solution 3: `nodejs_compat_populate_process_env` flag** (alternative)
   - For compatibility dates >= `2025-04-01`, this is default with `nodejs_compat`
   - Allows `process.env` access

3. **Separate auth options pattern** — The Hono CF example separates static options from runtime config:
   ```
   src/lib/better-auth/options.ts  — static config (plugins, basePath, etc.)
   src/lib/better-auth/index.ts    — factory function receiving env
   ```

### better-auth-cloudflare Plugin — Decision: SKIP

| Metric | Value |
|--------|-------|
| Stars | 455 |
| npm downloads/month | ~14,893 |
| Latest version | v0.2.9 (Dec 2025) |
| Status | Pre-1.0, 2-month gap since last release |

**What it provides:** D1/R2/KV wiring, CLI that works on CF, geolocation, IP detection.

**Why we're skipping:**
- Programmatic migrations (`getMigrations`) solve the CLI problem without extra deps
- We need custom R2 logic for generation images (not generic file storage)
- Pre-1.0 adds risk; hard dependency on `drizzle-orm ^0.44.5`
- Less moving parts = easier to debug

---

## Drizzle ORM + D1 Findings

### Confirmed
- `drizzle(env.DB)` wraps D1 binding directly
- Pass `{ schema }` as second arg for relational query API
- `dialect: 'sqlite'` in drizzle config

### Critical Corrections

1. **`driver: 'd1-http'` required in drizzle.config.ts** — Original plan omitted this. The CLI needs HTTP access to D1:
   ```typescript
   export default defineConfig({
     dialect: "sqlite",
     driver: "d1-http",
     schema: "./src/db/schema.ts",
     out: "./drizzle",
     dbCredentials: {
       accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
       databaseId: process.env.CLOUDFLARE_DATABASE_ID!,
       token: process.env.CLOUDFLARE_D1_TOKEN!,
     },
   });
   ```

2. **JSON columns: use `text({ mode: 'json' })` NOT `blob({ mode: 'json' })`** — SQLite JSON functions throw errors on BLOBs. Original plan used plain `text()` with manual JSON.parse — the `mode: 'json'` approach is better (auto-serialization).

3. **Dates: `integer({ mode: 'timestamp' })` is safer than `text()`** — Auto-casts to/from JS `Date`. However, better-auth expects its date columns as `text()` with ISO strings, so auth tables must keep `text()` format. Only our custom tables should use `integer({ mode: 'timestamp' })`.

4. **Booleans: `integer({ mode: 'boolean' })` maps 0/1** — Already correct in our schema.

5. **Indexes must be in the third argument of `sqliteTable`** as an array:
   ```typescript
   export const generation = sqliteTable("generation", {
     // columns...
   }, (table) => [
     index("generation_userId_idx").on(table.userId),
     index("generation_createdAt_idx").on(table.createdAt),
   ]);
   ```

6. **`migrations_dir` alignment** — Wrangler's `migrations_dir` and Drizzle's `out` must point to the same directory. Use `"drizzle"` for both.

---

## Schema Impact: Account Type & Credits

New requirement: free vs paid account types with credits per workflow.

### Approach: Separate `user_profile` table

better-auth's `user` table has a fixed schema. Rather than trying to add custom columns to it (which could break on better-auth upgrades), we create a **`user_profile`** table with a 1:1 relationship:

```
user (better-auth) ←──1:1──→ user_profile (our table)
  └──1:N──→ generation (our table)
```

`user_profile` holds:
- `accountType`: `"free"` | `"paid"`
- `creditsProductShoots`: integer (free accounts start with 1)
- `creditsAdGraphics`: integer (free accounts start with 1)

Credits are decremented on each generation. Workflow endpoints check credits > 0 before proceeding.

---

## Summary of All Corrections Applied

| File | Correction |
|------|-----------|
| 01-infrastructure | Added `driver: 'd1-http'` to drizzle.config, aligned `migrations_dir`/`out` to `"drizzle"`, added CF API credentials for drizzle-kit |
| 02-auth | Added `basePath: "/api/auth"`, added programmatic migration endpoint, separated static options from factory, removed `@better-auth/cli` dependency |
| 03-schema | Added `user_profile` table with accountType/credits, corrected index syntax, used `text({ mode: 'json' })` for JSON columns, kept `text()` dates for auth tables |
| 04-backend-api | Added credits check middleware, decrement on generation, credit balance endpoint |
| 07-migration | Split migration strategy: programmatic for auth tables, drizzle-kit for custom tables |
