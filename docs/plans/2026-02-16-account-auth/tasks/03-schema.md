# 03 — Database Schema: Auth Tables + Profile + Credits + Generation History

> Updated with account type/credits system, corrected Drizzle patterns per [Drizzle D1 docs](https://orm.drizzle.team/docs/connect-cloudflare-d1).

## Overview

All tables live in a single D1 database (`addreams-db`). Two categories:

1. **better-auth tables** (user, session, account, verification) — managed via programmatic migrations (`getMigrations`). Schema must match better-auth's expectations exactly.
2. **Application tables** (user_profile, generation) — managed via Drizzle Kit migrations. Schema fully under our control.

```
backend/src/db/
├── schema.ts          # Application table definitions (user_profile, generation)
└── index.ts           # DB factory: drizzle(env.DB, { schema })
```

## Auth Tables (better-auth Managed)

These 4 tables are created automatically by `getMigrations()` / `runMigrations()` from `better-auth/db`. We do NOT define them in our Drizzle schema — better-auth owns them.

For reference, these are the tables better-auth creates:

| Table | Key Columns |
|-------|-------------|
| `user` | id (TEXT PK), name, email (UNIQUE), emailVerified, image, createdAt, updatedAt |
| `session` | id (TEXT PK), userId (FK→user), token (UNIQUE), expiresAt, ipAddress, userAgent |
| `account` | id (TEXT PK), userId (FK→user), accountId, providerId, accessToken, refreshToken, password |
| `verification` | id (TEXT PK), identifier, value, expiresAt |

> **Do not add these to Drizzle schema** — they're managed by better-auth's programmatic migrations. Adding them to Drizzle would cause conflicts when running `drizzle-kit generate`.

## Application Tables (Drizzle Managed)

### `backend/src/db/schema.ts`

```typescript
import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// ──────────────────────────────────────────────
// User Profile (extends better-auth's user table)
// ──────────────────────────────────────────────

export const userProfile = sqliteTable("user_profile", {
  // 1:1 with better-auth's user table
  userId: text("user_id").primaryKey(),  // References user.id (not enforced via FK since user table isn't in Drizzle schema)

  // Account type
  accountType: text("account_type", { enum: ["free", "paid"] })
    .notNull()
    .default("free"),

  // Credits per workflow (free accounts start with 1 each)
  creditsProductShoots: integer("credits_product_shoots")
    .notNull()
    .default(1),
  creditsAdGraphics: integer("credits_ad_graphics")
    .notNull()
    .default(1),

  // Metadata
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// ──────────────────────────────────────────────
// Generation History
// ──────────────────────────────────────────────

export const generation = sqliteTable("generation", {
  id: text("id").primaryKey(),                      // UUID

  userId: text("user_id").notNull(),                // References user.id

  // Workflow type
  workflow: text("workflow", { enum: ["product-shoots", "ad-graphics"] })
    .notNull(),

  // Request inputs
  prompt: text("prompt").notNull(),
  negativePrompt: text("negative_prompt"),
  size: text("size"),                                // e.g. "1024x1024"

  // For ad-graphics: reference image
  referenceImageKey: text("reference_image_key"),    // R2 key

  // Result status
  status: text("status", { enum: ["pending", "completed", "failed"] })
    .notNull(),

  // Output images stored in R2 — keys as JSON array
  // e.g. ["generations/abc123/gen456/output-0.png"]
  outputImageKeys: text("output_image_keys", { mode: "json" })
    .$type<string[]>(),

  // Qwen API metadata
  externalRequestId: text("external_request_id"),
  errorMessage: text("error_message"),

  // Timestamps
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  completedAt: integer("completed_at", { mode: "timestamp" }),

}, (table) => [
  index("generation_user_id_idx").on(table.userId),
  index("generation_created_at_idx").on(table.createdAt),
  index("generation_workflow_idx").on(table.workflow),
]);
```

### Key Drizzle/D1 Patterns Used

| Pattern | Why |
|---------|-----|
| `text("col", { enum: [...] })` | Type-safe string enums without runtime overhead |
| `integer("col", { mode: "timestamp" })` | Auto-casts to/from JS `Date` objects |
| `text("col", { mode: "json" }).$type<T>()` | Auto-serializes JSON; `$type<T>()` adds TypeScript typing |
| `sql\`(unixepoch())\`` | SQLite built-in for current Unix timestamp |
| Third-arg array for indexes | Drizzle's SQLite index syntax |

### Why NOT `integer({ mode: "boolean" })`?

We don't have boolean columns in our custom tables. If needed in future, use `integer({ mode: "boolean" })` which maps to 0/1 in SQLite.

## DB Factory

### `backend/src/db/index.ts`

```typescript
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export function createDb(d1: D1Database) {
  return drizzle(d1, { schema });
}

export type Database = ReturnType<typeof createDb>;
```

Passing `{ schema }` enables the relational query API (`db.query.userProfile.findFirst(...)`, etc.).

## Entity Relationships

```
user (better-auth)
  ├──1:1──→ user_profile   (account type, credits)
  ├──1:N──→ session         (better-auth managed)
  ├──1:N──→ account         (better-auth managed, linked OAuth providers)
  └──1:N──→ generation      (image generation history)
```

Note: Foreign keys between application tables and better-auth tables are **logical** (not enforced via Drizzle `references()`) because the `user` table isn't in our Drizzle schema. We enforce integrity in application code.

## R2 Key Structure

```
generations/
  {userId}/
    {generationId}/
      reference.{ext}           # Uploaded reference image (ad-graphics only)
      output-0.{ext}            # First generated image
      output-1.{ext}            # Second (if any)
```

Example: `generations/user_abc123/gen_def456/output-0.png`

## Credits System Design

### Free Account Defaults
- `creditsProductShoots: 1` — One free Product Shoots generation
- `creditsAdGraphics: 1` — One free Ad Graphics generation

### Credit Flow
1. User signs up → `user_profile` created with default credits
2. User initiates generation → check `credits{Workflow} > 0`
3. If credits > 0 → proceed, decrement credit
4. If credits = 0 → return 403 with "No credits remaining"
5. If generation fails → credit is NOT refunded (keeps things simple; can add refund logic later)

### Paid Account
- `accountType: "paid"` — Credits are higher or replenished
- Credit top-up mechanism is out of scope for Phase 1 (manual DB update for now)

## Migration Strategy

### better-auth tables (user, session, account, verification)
```bash
# Applied via programmatic migration endpoint (first deploy only)
curl -X POST https://addreams-api.duncanb013.workers.dev/api/migrate
```

### Application tables (user_profile, generation)
```bash
# 1. Generate migration SQL from schema changes
cd backend
npx drizzle-kit generate

# 2. Review generated SQL in ./drizzle/

# 3. Apply to local D1
npx wrangler d1 migrations apply addreams-db --local

# 4. Apply to production D1
npx wrangler d1 migrations apply addreams-db --remote
```

### Order of Operations (First Deploy)
1. Deploy Worker code (with migration endpoint)
2. Run `wrangler d1 migrations apply addreams-db --remote` (creates application tables)
3. Hit `POST /api/migrate` (creates better-auth tables)
4. Remove or protect the migration endpoint

## D1 Limitations to Remember

- **No ALTER COLUMN** — Column type changes require table recreation (Drizzle Kit handles this)
- **No schemas/namespaces** — All tables in flat namespace
- **Max row size** — 1 MB (more than enough for our use)
- **Text JSON** — Use `text({ mode: 'json' })`, never `blob({ mode: 'json' })` (SQLite JSON functions throw on BLOBs)
