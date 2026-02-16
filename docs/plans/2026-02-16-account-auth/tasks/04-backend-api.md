# 04 — Backend API: Routes, Credits Enforcement, Generation Persistence, R2

> Updated with credits system, corrected patterns per research findings.

## Route Map (After Changes)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/health` | Public | Health check |
| ALL | `/api/auth/*` | Public | better-auth (sign-up, sign-in, OAuth, etc.) |
| POST | `/api/migrate` | Public* | Programmatic migration (remove after setup) |
| GET | `/api/me` | Required | Get current user profile + credits |
| POST | `/api/workflows/image-from-text` | Required | Product Shoots (checks credits, persists to DB+R2) |
| POST | `/api/workflows/image-from-reference` | Required | Ad Graphics (checks credits, persists to DB+R2) |
| GET | `/api/generations` | Required | List user's generation history |
| GET | `/api/generations/:id` | Required | Get single generation detail |
| GET | `/api/generations/:id/images/:index` | Required | Serve image from R2 |
| DELETE | `/api/generations/:id` | Required | Delete a generation + R2 objects |

*Migration endpoint should be removed or protected behind a secret after initial setup.

## Credits Middleware

Checks and decrements credits before allowing a workflow to proceed.

### `backend/src/routes/workflows.ts`

```typescript
import { Hono } from "hono";
import { eq, sql } from "drizzle-orm";
import { createDb } from "../db";
import { userProfile, generation } from "../db/schema";

const workflows = new Hono<{
  Bindings: WorkerBindings;
  Variables: { user: { id: string }; session: { id: string } };
}>();

/**
 * Ensure user has a profile row. Creates one with defaults if missing.
 * Returns the profile.
 */
async function ensureProfile(db: Database, userId: string) {
  let profile = await db.query.userProfile.findFirst({
    where: eq(userProfile.userId, userId),
  });

  if (!profile) {
    await db.insert(userProfile).values({ userId });
    profile = await db.query.userProfile.findFirst({
      where: eq(userProfile.userId, userId),
    });
  }

  return profile!;
}

/**
 * Check credits for a workflow. Returns the profile or a 403 response.
 */
function getCreditColumn(workflow: "product-shoots" | "ad-graphics") {
  return workflow === "product-shoots"
    ? userProfile.creditsProductShoots
    : userProfile.creditsAdGraphics;
}
```

## Updated Workflow: Product Shoots with Credits + Persistence

```
Client                  Worker API                    Qwen API              D1        R2
  │                        │                             │                   │         │
  ├─POST /api/workflows/──►│                             │                   │         │
  │  image-from-text       │                             │                   │         │
  │                        ├─ensureProfile───────────────────────────────────►│         │
  │                        ├─check credits > 0───────────────────────────────►│         │
  │                        │  (403 if no credits)        │                   │         │
  │                        ├─decrement credit────────────────────────────────►│         │
  │                        ├─INSERT generation (pending)─────────────────────►│         │
  │                        │                             │                   │         │
  │                        ├─POST dashscope/text2image──►│                   │         │
  │                        │◄──── image URLs ────────────┤                   │         │
  │                        │                             │                   │         │
  │                        ├─fetch images, PUT to R2─────────────────────────────────►│
  │                        ├─UPDATE generation (completed)───────────────────►│         │
  │                        │                             │                   │         │
  │◄── response ───────────┤                             │                   │         │
```

### Implementation

```typescript
workflows.post("/image-from-text", async (c) => {
  const user = c.get("user");
  const db = createDb(c.env.DB);
  const body = await c.req.json();
  const generationId = crypto.randomUUID();

  // 1. Ensure profile exists and check credits
  const profile = await ensureProfile(db, user.id);
  if (profile.creditsProductShoots <= 0) {
    return c.json({
      error: "No credits remaining for Product Shoots",
      creditsRemaining: 0,
    }, 403);
  }

  // 2. Decrement credit
  await db.update(userProfile)
    .set({
      creditsProductShoots: sql`${userProfile.creditsProductShoots} - 1`,
      updatedAt: sql`(unixepoch())`,
    })
    .where(eq(userProfile.userId, user.id));

  // 3. Create pending generation record
  await db.insert(generation).values({
    id: generationId,
    userId: user.id,
    workflow: "product-shoots",
    prompt: body.prompt,
    negativePrompt: body.negative_prompt ?? null,
    size: body.size ?? "1024x1024",
    status: "pending",
  });

  try {
    // 4. Call Qwen API (existing logic from current codebase)
    const result = await callQwenTextToImage(c.env, body);

    // 5. Download output images and store in R2
    const outputKeys: string[] = [];
    for (let i = 0; i < result.images.length; i++) {
      const imageUrl = result.images[i].url;
      const imageResponse = await fetch(imageUrl);
      const imageBuffer = await imageResponse.arrayBuffer();
      const key = `generations/${user.id}/${generationId}/output-${i}.png`;

      await c.env.GENERATIONS_BUCKET.put(key, imageBuffer, {
        httpMetadata: { contentType: "image/png" },
      });
      outputKeys.push(key);
    }

    // 6. Update generation record
    await db.update(generation)
      .set({
        status: "completed",
        outputImageKeys: outputKeys,  // Auto-serialized to JSON by Drizzle
        externalRequestId: result.requestId,
        completedAt: new Date(),       // Auto-converted to unix timestamp by Drizzle
      })
      .where(eq(generation.id, generationId));

    // 7. Return response
    return c.json({
      success: true,
      generationId,
      images: outputKeys.map((_, i) => ({
        url: `/api/generations/${generationId}/images/${i}`,
      })),
      creditsRemaining: profile.creditsProductShoots - 1,
    });

  } catch (error) {
    // Update generation as failed (credit is NOT refunded)
    await db.update(generation)
      .set({
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        completedAt: new Date(),
      })
      .where(eq(generation.id, generationId));

    throw error; // Let existing error handler deal with the response
  }
});
```

Ad Graphics workflow follows the same pattern with `creditsAdGraphics` and reference image upload.

## User Profile / Credits Endpoint

### GET /api/me

Returns the user's auth info plus their profile (account type, credits).

```typescript
app.get("/api/me", authMiddleware, async (c) => {
  const user = c.get("user");
  const session = c.get("session");
  const db = createDb(c.env.DB);

  const profile = await ensureProfile(db, user.id);

  return c.json({
    user,
    session,
    profile: {
      accountType: profile.accountType,
      credits: {
        productShoots: profile.creditsProductShoots,
        adGraphics: profile.creditsAdGraphics,
      },
    },
  });
});
```

## Generation History Endpoints

### `backend/src/routes/generations.ts`

```typescript
import { Hono } from "hono";
import { eq, desc, and } from "drizzle-orm";
import { createDb } from "../db";
import { generation } from "../db/schema";

const generations = new Hono<{
  Bindings: WorkerBindings;
  Variables: { user: { id: string } };
}>();

// ── List generations ──────────────────────────────────────
generations.get("/", async (c) => {
  const user = c.get("user");
  const db = createDb(c.env.DB);

  const page = parseInt(c.req.query("page") ?? "1");
  const limit = Math.min(parseInt(c.req.query("limit") ?? "20"), 50);
  const workflow = c.req.query("workflow");
  const offset = (page - 1) * limit;

  const conditions = [eq(generation.userId, user.id)];
  if (workflow === "product-shoots" || workflow === "ad-graphics") {
    conditions.push(eq(generation.workflow, workflow));
  }

  const results = await db.select()
    .from(generation)
    .where(and(...conditions))
    .orderBy(desc(generation.createdAt))
    .limit(limit)
    .offset(offset);

  return c.json({
    data: results.map((g) => ({
      id: g.id,
      workflow: g.workflow,
      prompt: g.prompt,
      negativePrompt: g.negativePrompt,
      size: g.size,
      status: g.status,
      errorMessage: g.errorMessage,
      createdAt: g.createdAt,
      completedAt: g.completedAt,
      images: (g.outputImageKeys ?? []).map((_: string, i: number) => ({
        url: `/api/generations/${g.id}/images/${i}`,
      })),
    })),
    page,
    limit,
  });
});

// ── Get single generation ─────────────────────────────────
generations.get("/:id", async (c) => {
  const user = c.get("user");
  const db = createDb(c.env.DB);
  const id = c.req.param("id");

  const result = await db.query.generation.findFirst({
    where: and(eq(generation.id, id), eq(generation.userId, user.id)),
  });

  if (!result) {
    return c.json({ error: "Not found" }, 404);
  }

  return c.json({
    ...result,
    outputImageKeys: undefined,
    images: (result.outputImageKeys ?? []).map((_: string, i: number) => ({
      url: `/api/generations/${result.id}/images/${i}`,
    })),
  });
});

// ── Serve image from R2 ──────────────────────────────────
generations.get("/:id/images/:index", async (c) => {
  const user = c.get("user");
  const db = createDb(c.env.DB);
  const id = c.req.param("id");
  const index = parseInt(c.req.param("index"));

  const result = await db.query.generation.findFirst({
    where: and(eq(generation.id, id), eq(generation.userId, user.id)),
  });

  if (!result) {
    return c.json({ error: "Not found" }, 404);
  }

  const keys = result.outputImageKeys ?? [];
  if (index < 0 || index >= keys.length) {
    return c.json({ error: "Image not found" }, 404);
  }

  const object = await c.env.GENERATIONS_BUCKET.get(keys[index]);
  if (!object) {
    return c.json({ error: "Image not found in storage" }, 404);
  }

  return new Response(object.body, {
    headers: {
      "Content-Type": object.httpMetadata?.contentType ?? "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
});

// ── Delete generation ─────────────────────────────────────
generations.delete("/:id", async (c) => {
  const user = c.get("user");
  const db = createDb(c.env.DB);
  const id = c.req.param("id");

  const result = await db.query.generation.findFirst({
    where: and(eq(generation.id, id), eq(generation.userId, user.id)),
  });

  if (!result) {
    return c.json({ error: "Not found" }, 404);
  }

  // Delete R2 objects
  const keys = [...(result.outputImageKeys ?? [])];
  if (result.referenceImageKey) keys.push(result.referenceImageKey);
  await Promise.all(keys.map((key) => c.env.GENERATIONS_BUCKET.delete(key)));

  // Delete DB record
  await db.delete(generation).where(eq(generation.id, id));

  return c.json({ success: true });
});

export default generations;
```

## Hono App Structure (Final)

```typescript
// backend/src/index.ts
import { Hono } from "hono";
import { cors } from "hono/cors";
import { createAuth } from "./auth";
import { authMiddleware } from "./auth/middleware";
import { getMigrations } from "better-auth/db";
import workflows from "./routes/workflows";
import generations from "./routes/generations";

const app = new Hono<{ Bindings: WorkerBindings }>();

// CORS (before auth)
app.use("/api/*", cors({ /* ... */ }));

// Public
app.get("/api/health", (c) => c.json({ status: "ok" }));

// Auth
app.on(["GET", "POST"], "/api/auth/*", (c) => {
  const auth = createAuth(c.env);
  return auth.handler(c.req.raw);
});

// Migration (remove after setup)
app.post("/api/migrate", async (c) => { /* ... */ });

// Protected
app.get("/api/me", authMiddleware, async (c) => { /* ... */ });

app.use("/api/workflows/*", authMiddleware);
app.route("/api/workflows", workflows);

app.use("/api/generations/*", authMiddleware);
app.route("/api/generations", generations);

// Global error handler
app.onError((err, c) => {
  console.error("Unhandled error:", err);
  return c.json({ error: "Internal server error" }, 500);
});

export default app;
```

## Performance Notes

1. **R2 download latency** — Downloading from Qwen + uploading to R2 adds time. Consider using `ctx.waitUntil()` for non-blocking R2 upload if response time matters more than immediate persistence.

2. **Credit decrement is not transactional** — D1 doesn't support multi-table transactions across Workers. The credit decrement + generation insert are separate operations. In a race condition, a user could theoretically use more credits than they have. For free-tier (1 credit), this is unlikely. For paid, consider using D1's batch API.

3. **Image caching** — `Cache-Control: immutable` on R2-served images prevents re-fetching since generated images never change.

4. **Pagination** — Offset-based is fine for per-user queries (small dataset). Switch to cursor-based only if volumes justify it.
