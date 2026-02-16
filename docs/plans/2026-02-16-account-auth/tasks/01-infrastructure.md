# 01 — Infrastructure: D1, R2, Drizzle, Wrangler Bindings

> Updated after verification against [D1 docs](https://developers.cloudflare.com/d1/get-started/), [D1 local dev](https://developers.cloudflare.com/d1/best-practices/local-development/), and [Drizzle D1 docs](https://orm.drizzle.team/docs/connect-cloudflare-d1).

## 1. Create D1 Database

```bash
cd backend
npx wrangler d1 create addreams-db
```

This outputs a `database_id` — save it for wrangler config. If prompted to auto-insert the binding, accept it.

## 2. Create R2 Bucket

```bash
npx wrangler r2 bucket create addreams-generations
```

## 3. Update `backend/wrangler.jsonc`

```jsonc
{
  "$schema": "../node_modules/wrangler/config-schema.json",
  "name": "addreams-api",
  "main": "./src/index.ts",
  "compatibility_date": "2026-02-10",
  "compatibility_flags": ["nodejs_compat"],

  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "addreams-db",
      "database_id": "<YOUR_DATABASE_ID>",
      "migrations_dir": "drizzle"
    }
  ],

  "r2_buckets": [
    {
      "binding": "GENERATIONS_BUCKET",
      "bucket_name": "addreams-generations"
    }
  ],

  "vars": {
    "QWEN_REGION": "sg",
    "QWEN_IMAGE_MODEL": "qwen-image-max",
    "QWEN_IMAGE_EDIT_MODEL": "qwen-image-edit-max",
    "QWEN_TIMEOUT_MS": "45000"
  }
}
```

### `nodejs_compat` flag

Required by better-auth (uses Node.js crypto APIs). For compatibility dates >= `2025-04-01`, `nodejs_compat` also populates `process.env` from vars/secrets automatically.

### `migrations_dir` alignment

**Critical:** `migrations_dir` in wrangler config must match the `out` directory in `drizzle.config.ts`. Both set to `"drizzle"`.

## 4. Update Worker Bindings Type

Run `npx wrangler types` to regenerate, or manually update:

```typescript
interface WorkerBindings {
  // Existing
  QWEN_API_KEY: string;
  QWEN_REGION: string;
  QWEN_IMAGE_MODEL: string;
  QWEN_IMAGE_EDIT_MODEL: string;
  QWEN_TIMEOUT_MS: string;

  // D1
  DB: D1Database;

  // R2
  GENERATIONS_BUCKET: R2Bucket;

  // Auth secrets
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
  BETTER_AUTH_TRUSTED_ORIGINS: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
}
```

## 5. Install Backend Dependencies

```bash
cd backend
npm install better-auth drizzle-orm
npm install -D drizzle-kit
```

Note: `@better-auth/cli` is **not** installed — we use programmatic migrations for auth tables (see [02-auth.md](./02-auth.md)), avoiding the Cloudflare Workers CLI import problem entirely.

## 6. Drizzle Kit Configuration

Create `backend/drizzle.config.ts`:

```typescript
import "dotenv/config";
import { defineConfig } from "drizzle-kit";

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

### Key details:
- **`driver: "d1-http"`** — Required for drizzle-kit to access D1 via Cloudflare's HTTP API (for `push`, `pull`, `studio` commands).
- **`dbCredentials`** — Cloudflare API token with D1 edit permissions. Only used by drizzle-kit CLI, not at runtime.
- **`out: "./drizzle"`** — Must match `migrations_dir` in wrangler config.

## 7. Environment Files

### `backend/.dev.vars` (Wrangler local dev — gitignored)

Used by `wrangler dev` for local development:

```env
QWEN_API_KEY=your-qwen-api-key
BETTER_AUTH_SECRET=generate-a-random-32-char-string-here
BETTER_AUTH_URL=http://localhost:8787
BETTER_AUTH_TRUSTED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

### `backend/.env` (drizzle-kit CLI — gitignored)

Used by `drizzle-kit` for `push`, `pull`, `studio`, `generate`:

```env
CLOUDFLARE_ACCOUNT_ID=your-cloudflare-account-id
CLOUDFLARE_DATABASE_ID=your-d1-database-id
CLOUDFLARE_D1_TOKEN=your-cloudflare-api-token
```

### Why two files?
- `.dev.vars` is Cloudflare's format — read by `wrangler dev` to populate `env.*` bindings
- `.env` is Node.js format — read by `drizzle-kit` via `dotenv` to populate `process.env.*`

Both must be in `.gitignore`.

## 8. Production Secrets

```bash
cd backend
wrangler secret put BETTER_AUTH_SECRET
wrangler secret put BETTER_AUTH_URL           # https://addreams-api.duncanb013.workers.dev
wrangler secret put BETTER_AUTH_TRUSTED_ORIGINS  # https://addreams-web.duncanb013.workers.dev
wrangler secret put GOOGLE_CLIENT_ID
wrangler secret put GOOGLE_CLIENT_SECRET
wrangler secret put GITHUB_CLIENT_ID
wrangler secret put GITHUB_CLIENT_SECRET
```

## 9. NPM Scripts (Backend)

Add to `backend/package.json`:

```json
{
  "scripts": {
    "db:generate": "drizzle-kit generate",
    "db:push": "drizzle-kit push",
    "db:migrate:local": "wrangler d1 migrations apply addreams-db --local",
    "db:migrate:remote": "wrangler d1 migrations apply addreams-db --remote",
    "db:studio": "drizzle-kit studio"
  }
}
```

## 10. Local Development Workflow

```bash
# 1. Start with a fresh local D1 (first time only — applies all migrations)
npm run db:migrate:local -w backend

# 2. Start backend dev server (local D1 data persists across restarts)
npm run dev:backend

# 3. Hit the programmatic migration endpoint for better-auth tables (first time only)
curl -X POST http://localhost:8787/api/migrate

# 4. Start frontend dev server (separate terminal)
npm run dev:frontend
```

**Important:** `wrangler dev` uses a local D1 instance by default. Local and remote databases are completely separate — local dev never touches production data.

## 11. Directory Structure (Backend After Changes)

```
backend/
├── drizzle/                   # Generated migration SQL (matches wrangler migrations_dir)
│   ├── 0000_*.sql
│   └── meta/
├── drizzle.config.ts          # drizzle-kit config (driver: d1-http)
├── src/
│   ├── db/
│   │   ├── schema.ts          # All Drizzle table definitions (custom tables only)
│   │   └── index.ts           # drizzle(env.DB, { schema }) factory
│   ├── auth/
│   │   ├── options.ts         # Static better-auth options (no env dependency)
│   │   ├── index.ts           # createAuth(env) factory
│   │   └── middleware.ts      # Hono auth middleware
│   ├── routes/
│   │   ├── workflows.ts       # Generation workflow handlers
│   │   └── generations.ts     # History CRUD endpoints
│   ├── lib/
│   │   └── qwen.ts            # Existing Qwen API client
│   └── index.ts               # Hono app entry point
├── .dev.vars                  # Local dev secrets (gitignored)
├── .env                       # drizzle-kit credentials (gitignored)
├── wrangler.jsonc
├── package.json
└── tsconfig.json
```
