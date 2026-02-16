# Auth, Profiles & Generation History — Implementation Plan

**Date:** 2026-02-16
**Updated:** 2026-02-16 (research verified against official docs)
**Branch:** `feat/auth-and-history`

## Scope

Add user authentication (better-auth), profile/account management, credits system, and persistent image generation history to the addreams platform, all backed by Cloudflare D1 + R2 with Drizzle ORM.

## Current State

| Layer | Status |
|-------|--------|
| Auth | None — all workflows are anonymous/public |
| Database | None — no D1, KV, or R2 bindings configured |
| ORM | None — Drizzle not installed |
| User model | None — no user/account/session tables |
| Generation history | None — results only live in client localStorage |
| File storage | None — generated images are external Qwen URLs |

## Target State

| Layer | Target |
|-------|--------|
| Auth | better-auth with email/password + Google + GitHub OAuth, no email verification |
| Database | Cloudflare D1 (SQLite) via Drizzle ORM |
| Object Storage | Cloudflare R2 for persisting generated images |
| User model | better-auth core tables + `user_profile` (account type, credits) |
| Generation history | `generation` table linking users to their image outputs |
| Access control | Auth required for all workflows; free accounts get 1 credit per workflow |
| Frontend | Sign-up/login pages, profile page, generation history gallery |

## Plan Documents

| # | File | Topic |
|---|------|-------|
| 01 | [01-infrastructure.md](./01-infrastructure.md) | D1, R2, Drizzle, wrangler bindings setup |
| 02 | [02-auth.md](./02-auth.md) | better-auth config, Hono integration, middleware |
| 03 | [03-schema.md](./03-schema.md) | Full database schema (auth + profile + credits + generation history) |
| 04 | [04-backend-api.md](./04-backend-api.md) | New API routes, credits enforcement, generation persistence, R2 uploads |
| 05 | [05-frontend-auth.md](./05-frontend-auth.md) | Auth client, auth context, sign-up/login/profile pages |
| 06 | [06-frontend-history.md](./06-frontend-history.md) | Generation history UI, gallery, detail views |
| 07 | [07-migration-and-deployment.md](./07-migration-and-deployment.md) | Migration workflow, secrets, deployment checklist |
| 08 | [08-research-findings.md](./08-research-findings.md) | Verified findings from official docs, corrections, decisions log |

## Decisions (Resolved)

| # | Question | Decision |
|---|----------|----------|
| 1 | Email verification | **No** — not for now, allow immediate access on sign-up |
| 2 | Access control | **Gate immediately** — all workflows require auth. Free accounts get 1 credit per workflow (product-shoots, ad-graphics) |
| 3 | Image retention | **Default** — keep indefinitely for now |
| 4 | Social providers | **Google + GitHub** — as currently planned |
| 5 | Profile fields | **Account type + credits** — `free` vs `paid` account type, numeric credits balance per workflow |

## Key Decisions (Technical)

1. **Factory pattern for better-auth** — D1 bindings are only available inside request handlers in Workers. Create auth per-request via `createAuth(env)`. Confirmed by [Hono CF example](https://hono.dev/examples/better-auth-on-cloudflare) and [better-auth docs](https://www.better-auth.com/docs/integrations/hono#cloudflare-workers).

2. **Drizzle ORM with `d1-http` driver** — Use Drizzle for both auth tables and custom tables (generation history, user profile). CLI config requires `driver: 'd1-http'` and Cloudflare API credentials for `drizzle-kit push/pull`. See [Drizzle D1 docs](https://orm.drizzle.team/docs/connect-cloudflare-d1).

3. **Programmatic migrations for better-auth tables** — Use `getMigrations()` from `better-auth/db` via a protected `/migrate` endpoint, avoiding the CLI import problem entirely. Custom tables use `drizzle-kit generate` + `wrangler d1 migrations apply`. See [02-auth.md](./02-auth.md).

4. **Skip `better-auth-cloudflare` plugin** — After research (455 stars, v0.2.9 pre-1.0), decided to skip. The programmatic migration approach solves the CLI problem, and we need custom R2 logic for generation images that the plugin doesn't cover. Less dependencies = less risk.

5. **R2 for generated images** — Copy Qwen output to R2. Serve through authenticated Worker endpoint (not public bucket) for access control.

6. **Cookie-based sessions with cache** — Cookie cache (5 min) reduces D1 reads. Same-origin via frontend worker proxy eliminates CORS complexity.

7. **Auth routes at `/api/auth/*`** — Note: better-auth `basePath` must be set to `"/api/auth"` and Hono route must match as `"/api/auth/*"`.

## Dependencies to Install

### Backend (`backend/`)
```bash
npm install better-auth drizzle-orm
npm install -D drizzle-kit
```

Note: `@better-auth/cli` is **not** needed — we use programmatic migrations instead (avoids the Cloudflare Workers CLI import problem).

### Frontend (`frontend/`)
```bash
npm install better-auth
```
(Only `better-auth/react` client-side module is used.)

### Environment for drizzle-kit CLI
```bash
# Needed in .env for drizzle-kit push/pull/studio (not for runtime)
CLOUDFLARE_ACCOUNT_ID=...
CLOUDFLARE_DATABASE_ID=...
CLOUDFLARE_D1_TOKEN=...
```
