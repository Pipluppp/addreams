import { Hono } from "hono";
import type { Context } from "hono";
import { cors } from "hono/cors";
import { and, desc, eq, sql } from "drizzle-orm";
import {
  DashScopeRequestError,
  callDashScopeGeneration,
  resolveQwenConfig,
  type WorkerBindings,
} from "./lib/qwen";
import {
  normalizeImageFromReferencePayload,
  normalizeImageFromTextPayload,
} from "./lib/workflow-validation";
import { createAuth } from "./auth";
import { createDb } from "./db";
import * as schema from "./db/schema";
import {
  ensureUserProfile,
  refundCredit,
  reserveCredit,
  type CreditBalance,
  type CreditWorkflow,
} from "./lib/credits";
import { parseJsonText, uploadGenerationAsset } from "./lib/history";

type Bindings = WorkerBindings & {
  DB: D1Database;
  GENERATIONS_BUCKET?: R2Bucket;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
  TRUSTED_ORIGINS: string;
};

type Variables = {
  user: { id: string; name: string; email: string; image: string | null };
  session: { id: string; token: string; userId: string };
};

type WorkflowName = "image-from-text" | "image-from-reference" | "video-from-reference";

type NormalizedError = {
  error: {
    code: string;
    message: string;
    providerCode?: string;
    providerRequestId?: string;
  };
  requestId: string;
};

type ProviderUsage = {
  image_count?: number;
  width?: number;
  height?: number;
};

type GenerationStatus = "pending" | "succeeded" | "failed";

type HistorySummaryRow = typeof schema.generation.$inferSelect;

const EXPIRES_IN_HOURS = 24;

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

app.use("/api/*", (c, next) => {
  const trustedOrigins = c.env.TRUSTED_ORIGINS.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  return cors({
    origin: (origin) => {
      if (!origin) return undefined;
      return trustedOrigins.includes(origin) ? origin : undefined;
    },
    credentials: true,
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  })(c, next);
});

// Auth catch-all — must be before other /api routes
app.on(["POST", "GET"], "/api/auth/**", (c) => {
  const auth = createAuth(c.env);
  return auth.handler(c.req.raw);
});

app.get("/api/health", (context) =>
  context.json({
    status: "ok",
    service: "addreams-api",
    timestamp: new Date().toISOString(),
  }),
);

// Auth middleware for protected routes
async function requireAuth(c: Context<{ Bindings: Bindings; Variables: Variables }>, next: () => Promise<void>) {
  const auth = createAuth(c.env);
  const result = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!result) return unauthorizedError(c);
  c.set("user", result.user as Variables["user"]);
  c.set("session", result.session as Variables["session"]);
  return next();
}

// Profile endpoint — lazy-creates user_profile on first access
app.get("/api/me", requireAuth, async (c) => {
  const user = c.get("user");
  const db = createDb(c.env.DB);
  const profile = await ensureUserProfile(db, user.id);

  return c.json({ user, profile });
});

app.use("/api/workflows/*", requireAuth);

app.post("/api/workflows/image-from-text", async (context) => {
  const requestId = crypto.randomUUID();
  const user = context.get("user");
  const db = createDb(context.env.DB);
  const body = await parseJsonBody(context);
  if (!body.success) {
    return validationError(context, requestId, "Invalid JSON payload.");
  }

  const normalized = normalizeImageFromTextPayload(body.data);
  if (!normalized.success) {
    return validationError(context, requestId, normalized.message);
  }

  const config = resolveQwenConfig(context.env);
  if (!config.success) {
    return backendConfigError(context, requestId, config.message);
  }

  const creditReservation = await reserveCredit({
    db,
    d1: context.env.DB,
    userId: user.id,
    workflow: "image-from-text",
  });

  if (!creditReservation.success) {
    return outOfCreditsError(context, requestId, creditReservation.balance);
  }

  const generationId = await createPendingGenerationRecord({
    db,
    userId: user.id,
    workflow: "image-from-text",
    input: {
      requestId,
      prompt: normalized.data.prompt,
      parameters: normalized.data,
    },
  });

  try {
    const providerBody = {
      model: config.data.imageModel,
      input: {
        messages: [{ role: "user", content: [{ text: normalized.data.prompt }] }],
      },
      parameters: {
        n: 1,
        ...(normalized.data.size ? { size: normalized.data.size } : {}),
        ...(normalized.data.negativePrompt
          ? { negative_prompt: normalized.data.negativePrompt }
          : {}),
        ...(typeof normalized.data.seed === "number" ? { seed: normalized.data.seed } : {}),
        prompt_extend: normalized.data.promptExtend,
        watermark: normalized.data.watermark,
      },
    };

    const providerResponse = await callDashScopeGeneration({
      apiKey: config.data.apiKey,
      region: config.data.region,
      timeoutMs: config.data.timeoutMs,
      body: providerBody,
    });

    const urls = extractImageUrls(providerResponse.payload);
    if (urls.length === 0) {
      throw new DashScopeRequestError({
        status: 502,
        backendCode: "UPSTREAM_MALFORMED_RESPONSE",
        message: "Image provider returned an invalid response body.",
        providerRequestId: providerResponse.providerRequestId,
      });
    }

    const asset = await persistGenerationAsset(context, user.id, generationId, urls[0]);
    const usage = parseUsage(providerResponse.payload);
    const responsePayload = successPayload({
      workflow: "image-from-text",
      requestId,
      model: config.data.imageModel,
      providerPayload: providerResponse.payload,
      providerRequestId: providerResponse.providerRequestId,
      images: urls,
      credits: creditReservation.balance,
      generationId,
    });

    await markGenerationSucceededRecord({
      db,
      userId: user.id,
      generationId,
      providerRequestId: providerResponse.providerRequestId,
      providerModel: config.data.imageModel,
      r2Key: asset?.r2Key,
      output: {
        requestId,
        images: urls,
        usage,
        assetUrl: asset ? `/api/history/${generationId}/asset` : null,
      },
    });

    return context.json(
      responsePayload,
      200,
    );
  } catch (error) {
    await safelyMarkGenerationFailed({
      db,
      userId: user.id,
      generationId,
      errorCode: error instanceof DashScopeRequestError ? error.backendCode : "INTERNAL_SERVER_ERROR",
      errorMessage:
        error instanceof DashScopeRequestError ? error.message : "Internal server error.",
      requestId,
    });

    await safelyRefundCredit({
      db,
      d1: context.env.DB,
      userId: user.id,
      workflow: "image-from-text",
      requestId,
    });
    return handleWorkflowError(context, requestId, error);
  }
});

app.post("/api/workflows/image-from-reference", async (context) => {
  const requestId = crypto.randomUUID();
  const user = context.get("user");
  const db = createDb(context.env.DB);
  const body = await parseJsonBody(context);
  if (!body.success) {
    return validationError(context, requestId, "Invalid JSON payload.");
  }

  const normalized = normalizeImageFromReferencePayload(body.data);
  if (!normalized.success) {
    return validationError(context, requestId, normalized.message);
  }

  const config = resolveQwenConfig(context.env);
  if (!config.success) {
    return backendConfigError(context, requestId, config.message);
  }

  const creditReservation = await reserveCredit({
    db,
    d1: context.env.DB,
    userId: user.id,
    workflow: "image-from-reference",
  });

  if (!creditReservation.success) {
    return outOfCreditsError(context, requestId, creditReservation.balance);
  }

  const generationId = await createPendingGenerationRecord({
    db,
    userId: user.id,
    workflow: "image-from-reference",
    input: {
      requestId,
      prompt: normalized.data.prompt,
      referenceImage: normalized.data.referenceImage,
      parameters: normalized.data,
    },
  });

  try {
    const providerBody = {
      model: config.data.imageEditModel,
      input: {
        messages: [
          {
            role: "user",
            content: [
              { image: normalized.data.referenceImage },
              { text: normalized.data.prompt },
            ],
          },
        ],
      },
      parameters: {
        n: normalized.data.n,
        ...(normalized.data.size ? { size: normalized.data.size } : {}),
        ...(normalized.data.negativePrompt
          ? { negative_prompt: normalized.data.negativePrompt }
          : {}),
        ...(typeof normalized.data.seed === "number" ? { seed: normalized.data.seed } : {}),
        prompt_extend: normalized.data.promptExtend,
        watermark: normalized.data.watermark,
      },
    };

    const providerResponse = await callDashScopeGeneration({
      apiKey: config.data.apiKey,
      region: config.data.region,
      timeoutMs: config.data.timeoutMs,
      body: providerBody,
    });

    const urls = extractImageUrls(providerResponse.payload);
    if (urls.length === 0) {
      throw new DashScopeRequestError({
        status: 502,
        backendCode: "UPSTREAM_MALFORMED_RESPONSE",
        message: "Image provider returned an invalid response body.",
        providerRequestId: providerResponse.providerRequestId,
      });
    }

    const asset = await persistGenerationAsset(context, user.id, generationId, urls[0]);
    const usage = parseUsage(providerResponse.payload);
    const responsePayload = successPayload({
      workflow: "image-from-reference",
      requestId,
      model: config.data.imageEditModel,
      providerPayload: providerResponse.payload,
      providerRequestId: providerResponse.providerRequestId,
      images: urls,
      credits: creditReservation.balance,
      generationId,
    });

    await markGenerationSucceededRecord({
      db,
      userId: user.id,
      generationId,
      providerRequestId: providerResponse.providerRequestId,
      providerModel: config.data.imageEditModel,
      r2Key: asset?.r2Key,
      output: {
        requestId,
        images: urls,
        usage,
        assetUrl: asset ? `/api/history/${generationId}/asset` : null,
      },
    });

    return context.json(responsePayload, 200);
  } catch (error) {
    await safelyMarkGenerationFailed({
      db,
      userId: user.id,
      generationId,
      errorCode: error instanceof DashScopeRequestError ? error.backendCode : "INTERNAL_SERVER_ERROR",
      errorMessage:
        error instanceof DashScopeRequestError ? error.message : "Internal server error.",
      requestId,
    });

    await safelyRefundCredit({
      db,
      d1: context.env.DB,
      userId: user.id,
      workflow: "image-from-reference",
      requestId,
    });
    return handleWorkflowError(context, requestId, error);
  }
});

app.post("/api/workflows/video-from-reference", async (context) => {
  const requestId = crypto.randomUUID();
  const user = context.get("user");
  const db = createDb(context.env.DB);
  const body = await parseJsonBody(context);
  if (!body.success) {
    return context.json({ error: "Invalid JSON payload" }, 400);
  }

  const payload = body.data;
  const prompt = isRecord(payload) ? payload.prompt : undefined;
  const referenceImageUrl = isRecord(payload) ? payload.referenceImageUrl : undefined;

  if (!isNonEmpty(prompt) || !isNonEmpty(referenceImageUrl)) {
    return context.json({ error: "prompt and referenceImageUrl are required" }, 400);
  }

  const creditReservation = await reserveCredit({
    db,
    d1: context.env.DB,
    userId: user.id,
    workflow: "video-from-reference",
  });

  if (!creditReservation.success) {
    return outOfCreditsError(context, requestId, creditReservation.balance);
  }

  const generationId = await createPendingGenerationRecord({
    db,
    userId: user.id,
    workflow: "video-from-reference",
    input: {
      requestId,
      prompt,
      referenceImageUrl,
    },
  });

  try {
    await markGenerationSucceededRecord({
      db,
      userId: user.id,
      generationId,
      providerRequestId: undefined,
      providerModel: context.env.QWEN_VIDEO_MODEL?.trim() || null,
      r2Key: null,
      output: {
        requestId,
        receivedAt: new Date().toISOString(),
        status: "stub",
      },
    });
  } catch {
    await safelyRefundCredit({
      db,
      d1: context.env.DB,
      userId: user.id,
      workflow: "video-from-reference",
      requestId,
    });
    return context.json(
      {
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Internal server error.",
        },
        requestId,
      } satisfies NormalizedError,
      500,
    );
  }

  return stubResponse(
    context,
    "video-from-reference",
    creditReservation.balance,
    requestId,
    generationId,
  );
});

app.get("/api/history", requireAuth, async (context) => {
  const user = context.get("user");
  const db = createDb(context.env.DB);
  const limit = parsePositiveInt(context.req.query("limit"), 20, 1, 50);
  const offset = parsePositiveInt(context.req.query("offset"), 0, 0, 10_000);
  const workflow = parseWorkflowFilter(context.req.query("workflow"));
  const status = parseGenerationStatus(context.req.query("status"));

  const filters = [eq(schema.generation.userId, user.id)];
  if (workflow) {
    filters.push(eq(schema.generation.workflow, workflow));
  }
  if (status) {
    filters.push(eq(schema.generation.status, status));
  }

  const whereClause = filters.length === 1 ? filters[0] : and(...filters);

  const rows = await db
    .select()
    .from(schema.generation)
    .where(whereClause)
    .orderBy(desc(schema.generation.createdAt))
    .limit(limit)
    .offset(offset);

  const [countRow] = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.generation)
    .where(whereClause);

  const total = Number(countRow?.count ?? 0);
  const nextOffset = offset + rows.length < total ? offset + limit : null;

  return context.json({
    items: rows.map((row) => mapHistorySummary(row, context.req.url)),
    pagination: {
      limit,
      offset,
      total,
      nextOffset,
    },
  });
});

app.get("/api/history/:id", requireAuth, async (context) => {
  const user = context.get("user");
  const db = createDb(context.env.DB);
  const generationId = context.req.param("id");

  const row = await getGenerationForUser(db, user.id, generationId);
  if (!row) {
    return context.json({ error: "History item not found." }, 404);
  }

  return context.json({ item: mapHistoryDetail(row, context.req.url) });
});

app.get("/api/history/:id/asset", requireAuth, async (context) => {
  const bucket = context.env.GENERATIONS_BUCKET;
  if (!bucket) {
    return backendConfigError(
      context,
      crypto.randomUUID(),
      "GENERATIONS_BUCKET is not configured.",
    );
  }

  const user = context.get("user");
  const db = createDb(context.env.DB);
  const generationId = context.req.param("id");

  const row = await getGenerationForUser(db, user.id, generationId);
  if (!row?.r2Key) {
    return context.json({ error: "History item asset not found." }, 404);
  }

  const asset = await bucket.get(row.r2Key);
  if (!asset?.body) {
    return context.json({ error: "History item asset not found." }, 404);
  }

  return new Response(asset.body, {
    headers: {
      "content-type": asset.httpMetadata?.contentType || "application/octet-stream",
      "cache-control": "private, max-age=3600",
    },
  });
});

app.delete("/api/history/:id", requireAuth, async (context) => {
  const user = context.get("user");
  const db = createDb(context.env.DB);
  const generationId = context.req.param("id");
  const row = await getGenerationForUser(db, user.id, generationId);

  if (!row) {
    return context.json({ error: "History item not found." }, 404);
  }

  await db
    .delete(schema.generation)
    .where(and(eq(schema.generation.id, generationId), eq(schema.generation.userId, user.id)));

  if (row.r2Key && context.env.GENERATIONS_BUCKET) {
    await context.env.GENERATIONS_BUCKET.delete(row.r2Key);
  }

  return context.json({ id: generationId, deleted: true });
});

app.onError((_error, context) => {
  const requestId = crypto.randomUUID();
  return context.json(
    {
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Internal server error.",
      },
      requestId,
    } satisfies NormalizedError,
    500,
  );
});

app.notFound((context) => context.json({ error: "Not found" }, 404));

function successPayload(args: {
  workflow: Exclude<WorkflowName, "video-from-reference">;
  requestId: string;
  generationId: string;
  model: string;
  providerPayload: unknown;
  providerRequestId?: string;
  images: string[];
  credits: CreditBalance;
}) {
  const usage = parseUsage(args.providerPayload);
  const providerRequestId =
    args.providerRequestId ??
    (isRecord(args.providerPayload) ? readString(args.providerPayload.request_id) : undefined);

  return {
    workflow: args.workflow,
    status: "completed" as const,
    requestId: args.requestId,
    generationId: args.generationId,
    provider: {
      name: "qwen" as const,
      requestId: providerRequestId,
      model: args.model,
    },
    output: {
      images: args.images.map((url) => ({ url })),
      expiresInHours: EXPIRES_IN_HOURS,
    },
    credits: args.credits,
    ...(usage ? { usage } : {}),
  };
}

function parseUsage(payload: unknown):
  | {
      imageCount?: number;
      width?: number;
      height?: number;
    }
  | undefined {
  if (!isRecord(payload)) return undefined;
  const usage = payload.usage;
  if (!isRecord(usage)) return undefined;

  const data = usage as ProviderUsage;
  const mapped = {
    ...(typeof data.image_count === "number" ? { imageCount: data.image_count } : {}),
    ...(typeof data.width === "number" ? { width: data.width } : {}),
    ...(typeof data.height === "number" ? { height: data.height } : {}),
  };

  return Object.keys(mapped).length > 0 ? mapped : undefined;
}

function extractImageUrls(payload: unknown): string[] {
  if (!isRecord(payload)) return [];
  const output = payload.output;
  if (!isRecord(output)) return [];

  const choices = output.choices;
  if (!Array.isArray(choices) || choices.length === 0) return [];

  const firstChoice = choices[0];
  if (!isRecord(firstChoice)) return [];

  const message = firstChoice.message;
  if (!isRecord(message)) return [];

  const content = message.content;
  if (!Array.isArray(content)) return [];

  const urls: string[] = [];
  for (const item of content) {
    if (!isRecord(item)) continue;
    const url = readString(item.image);
    if (url) urls.push(url);
  }

  return urls;
}

function handleWorkflowError(context: Context, requestId: string, error: unknown) {
  if (error instanceof DashScopeRequestError) {
    return context.json(
      {
        error: {
          code: error.backendCode,
          message: error.message,
          ...(error.providerCode ? { providerCode: error.providerCode } : {}),
          ...(error.providerRequestId ? { providerRequestId: error.providerRequestId } : {}),
        },
        requestId,
      } satisfies NormalizedError,
      error.status as 502 | 504,
    );
  }

  return context.json(
    {
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Internal server error.",
      },
      requestId,
    } satisfies NormalizedError,
    500,
  );
}

function validationError(context: Context, requestId: string, message: string) {
  return context.json(
    {
      error: {
        code: "INVALID_REQUEST",
        message,
      },
      requestId,
    } satisfies NormalizedError,
    400,
  );
}

function unauthorizedError(context: Context) {
  return context.json(
    {
      error: {
        code: "UNAUTHORIZED",
        message: "Authentication required.",
      },
      requestId: crypto.randomUUID(),
    } satisfies NormalizedError,
    401,
  );
}

function outOfCreditsError(context: Context, requestId: string, balance: CreditBalance) {
  return context.json(
    {
      error: {
        code: "OUT_OF_CREDITS",
        message: "You do not have credits remaining for this workflow.",
      },
      requestId,
      credits: balance,
    },
    402,
  );
}

async function createPendingGenerationRecord(args: {
  db: ReturnType<typeof createDb>;
  userId: string;
  workflow: WorkflowName;
  input: unknown;
}) {
  const generationId = crypto.randomUUID();

  await args.db.insert(schema.generation).values({
    id: generationId,
    userId: args.userId,
    workflow: args.workflow,
    status: "pending",
    inputJson: JSON.stringify(args.input),
  });

  return generationId;
}

async function markGenerationSucceededRecord(args: {
  db: ReturnType<typeof createDb>;
  userId: string;
  generationId: string;
  providerRequestId?: string;
  providerModel: string | null;
  r2Key: string | null | undefined;
  output: unknown;
}) {
  await args.db
    .update(schema.generation)
    .set({
      status: "succeeded",
      outputJson: JSON.stringify(args.output),
      providerRequestId: args.providerRequestId,
      providerModel: args.providerModel,
      r2Key: args.r2Key ?? null,
      errorCode: null,
      errorMessage: null,
      updatedAt: sql`(unixepoch())`,
    })
    .where(
      and(eq(schema.generation.id, args.generationId), eq(schema.generation.userId, args.userId)),
    );
}

async function markGenerationFailedRecord(args: {
  db: ReturnType<typeof createDb>;
  userId: string;
  generationId: string;
  errorCode: string;
  errorMessage: string;
}) {
  await args.db
    .update(schema.generation)
    .set({
      status: "failed",
      errorCode: args.errorCode,
      errorMessage: args.errorMessage,
      updatedAt: sql`(unixepoch())`,
    })
    .where(
      and(eq(schema.generation.id, args.generationId), eq(schema.generation.userId, args.userId)),
    );
}

async function safelyMarkGenerationFailed(args: {
  db: ReturnType<typeof createDb>;
  userId: string;
  generationId: string;
  errorCode: string;
  errorMessage: string;
  requestId: string;
}) {
  try {
    await markGenerationFailedRecord({
      db: args.db,
      userId: args.userId,
      generationId: args.generationId,
      errorCode: args.errorCode,
      errorMessage: args.errorMessage,
    });
  } catch (error) {
    console.error("generation_status_update_failed", {
      requestId: args.requestId,
      userId: args.userId,
      generationId: args.generationId,
      error: error instanceof Error ? error.message : "unknown_error",
    });
  }
}

async function persistGenerationAsset(
  context: Context<{ Bindings: Bindings; Variables: Variables }>,
  userId: string,
  generationId: string,
  sourceUrl: string | undefined,
) {
  if (!sourceUrl || !context.env.GENERATIONS_BUCKET) {
    return null;
  }

  return uploadGenerationAsset({
    bucket: context.env.GENERATIONS_BUCKET,
    sourceUrl,
    userId,
    generationId,
  });
}

async function getGenerationForUser(
  db: ReturnType<typeof createDb>,
  userId: string,
  generationId: string,
) {
  return db.query.generation.findFirst({
    where: and(eq(schema.generation.id, generationId), eq(schema.generation.userId, userId)),
  });
}

function mapHistorySummary(row: HistorySummaryRow, requestUrl: string) {
  const output = parseJsonText(row.outputJson);
  const fallbackImageUrl = extractFirstImageUrl(output);
  const assetUrl = row.r2Key
    ? new URL(`/api/history/${row.id}/asset`, requestUrl).toString()
    : fallbackImageUrl;

  return {
    id: row.id,
    workflow: row.workflow,
    status: row.status,
    createdAt: toIsoString(row.createdAt),
    updatedAt: toIsoString(row.updatedAt),
    providerModel: row.providerModel,
    providerRequestId: row.providerRequestId,
    errorCode: row.errorCode,
    errorMessage: row.errorMessage,
    r2Key: row.r2Key,
    assetUrl,
  };
}

function mapHistoryDetail(row: HistorySummaryRow, requestUrl: string) {
  const output = parseJsonText(row.outputJson);
  const input = parseJsonText(row.inputJson);

  return {
    ...mapHistorySummary(row, requestUrl),
    input,
    output,
  };
}

function parseGenerationStatus(value: string | undefined): GenerationStatus | null {
  if (value === "pending" || value === "succeeded" || value === "failed") {
    return value;
  }
  return null;
}

function parseWorkflowFilter(value: string | undefined): WorkflowName | null {
  if (
    value === "image-from-text" ||
    value === "image-from-reference" ||
    value === "video-from-reference"
  ) {
    return value;
  }
  return null;
}

function parsePositiveInt(
  value: string | undefined,
  fallback: number,
  min: number,
  max: number,
): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, parsed));
}

function extractFirstImageUrl(output: unknown): string | null {
  if (!isRecord(output)) {
    return null;
  }

  const images = output.images;
  if (!Array.isArray(images) || images.length === 0) {
    return null;
  }

  const first = images[0];
  if (!isRecord(first)) {
    return null;
  }

  const url = first.url;
  return typeof url === "string" && url.trim().length > 0 ? url : null;
}

function toIsoString(value: Date | null): string | null {
  return value ? value.toISOString() : null;
}

function backendConfigError(context: Context, requestId: string, message: string) {
  return context.json(
    {
      error: {
        code: "BACKEND_MISCONFIGURED",
        message,
      },
      requestId,
    } satisfies NormalizedError,
    500,
  );
}

function isNonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

async function parseJsonBody(context: Context): Promise<{ success: true; data: unknown } | { success: false }> {
  try {
    const parsed = (await context.req.json()) as unknown;
    return { success: true, data: parsed };
  } catch {
    return { success: false };
  }
}

function stubResponse(
  context: Context,
  workflow: WorkflowName,
  credits: CreditBalance,
  requestId: string,
  generationId: string,
) {
  return context.json(
    {
      workflow,
      status: "stub",
      requestId,
      generationId,
      credits,
      receivedAt: new Date().toISOString(),
    },
    202,
  );
}

async function safelyRefundCredit(args: {
  db: ReturnType<typeof createDb>;
  d1: D1Database;
  userId: string;
  workflow: CreditWorkflow;
  requestId: string;
}) {
  try {
    await refundCredit({
      db: args.db,
      d1: args.d1,
      userId: args.userId,
      workflow: args.workflow,
    });
  } catch (error) {
    console.error("credit_refund_failed", {
      requestId: args.requestId,
      userId: args.userId,
      workflow: args.workflow,
      error: error instanceof Error ? error.message : "unknown_error",
    });
  }
}

function readString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export default app;
