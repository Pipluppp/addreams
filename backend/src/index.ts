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
import { parseJsonText, uploadGenerationAsset, uploadReferenceAsset } from "./lib/history";

type Bindings = WorkerBindings & {
  DB: D1Database;
  GENERATIONS_BUCKET?: R2Bucket;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
  TRUSTED_ORIGINS: string;
  ENVIRONMENT?: string;
  BYPASS_CREDIT_LIMITS?: string;
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
const PRODUCT_SHOOT_RUN_LIMIT_DEFAULT = 10;
const PRODUCT_SHOOT_RUN_LIMIT_MAX = 24;
const MAX_REFERENCE_IMAGE_BYTES = 10 * 1024 * 1024;
const REFERENCE_IMAGE_FETCH_TIMEOUT_MS = 15_000;
const MAX_REFERENCE_IMAGE_REDIRECTS = 3;
const INTERNAL_HISTORY_ASSET_PATH_PATTERN = /^\/api\/history\/([^/]+)\/asset\/?$/;
const INTERNAL_PRODUCT_SHOOT_SOURCE_PATH_PATTERN =
  /^\/api\/product-shoots\/runs\/([^/]+)\/source\/?$/;
const SUPPORTED_REFERENCE_IMAGE_CONTENT_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/bmp",
  "image/webp",
  "image/tiff",
  "image/gif",
]);
const REFERENCE_IMAGE_CONTENT_TYPE_ALIASES: Record<string, string> = {
  "image/jpg": "image/jpeg",
  "image/pjpeg": "image/jpeg",
  "image/x-ms-bmp": "image/bmp",
  "image/x-bmp": "image/bmp",
  "image/tif": "image/tiff",
  "image/x-tiff": "image/tiff",
};

type ProductShootTemplateSnapshot = {
  id: string;
  label: string;
};

type ProductShootContext = {
  runId: string;
  templateId: string;
  templateLabel: string;
  selectedTemplates: ProductShootTemplateSnapshot[];
  aspectRatioId?: string;
};

type ProductShootRunOutputSummary = {
  generationId: string;
  templateId: string;
  templateLabel: string;
  imageUrl: string | null;
  createdAt: string | null;
};

type ProductShootRunSummary = {
  runId: string;
  createdAt: string | null;
  updatedAt: string | null;
  sourceImageUrl: string | null;
  templates: ProductShootTemplateSnapshot[];
  outputCount: number;
  outputs: ProductShootRunOutputSummary[];
  aspectRatioId: string | null;
};

type ReferenceImageResolutionSource =
  | "provided-data-url"
  | "internal-history-asset"
  | "internal-run-source"
  | "external-url";

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
async function requireAuth(
  c: Context<{ Bindings: Bindings; Variables: Variables }>,
  next: () => Promise<void>,
) {
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

type CreditReservation = Awaited<ReturnType<typeof reserveCredit>>;

function isCreditBypassEnabled(env: Bindings): boolean {
  const bypassValue = env.BYPASS_CREDIT_LIMITS?.trim().toLowerCase();
  if (bypassValue === "1" || bypassValue === "true" || bypassValue === "yes") {
    return true;
  }

  const environment = env.ENVIRONMENT?.trim().toLowerCase();
  return environment === "development" || environment === "local";
}

async function getCreditBalanceSnapshot(
  db: ReturnType<typeof createDb>,
  userId: string,
): Promise<CreditBalance> {
  const profile = await ensureUserProfile(db, userId);
  return {
    imageEdits: profile.creditsImageEdits,
  };
}

async function reserveCreditsForWorkflow(args: {
  env: Bindings;
  db: ReturnType<typeof createDb>;
  d1: D1Database;
  userId: string;
  workflow: CreditWorkflow;
}): Promise<{
  reservation: CreditReservation;
  creditsWereReserved: boolean;
}> {
  if (isCreditBypassEnabled(args.env)) {
    return {
      reservation: {
        success: true,
        balance: await getCreditBalanceSnapshot(args.db, args.userId),
      },
      creditsWereReserved: false,
    };
  }

  return {
    reservation: await reserveCredit({
      db: args.db,
      d1: args.d1,
      userId: args.userId,
      workflow: args.workflow,
    }),
    creditsWereReserved: true,
  };
}

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

  const { reservation: creditReservation, creditsWereReserved } = await reserveCreditsForWorkflow({
    env: context.env,
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

    let asset: Awaited<ReturnType<typeof persistGenerationAsset>> = null;
    try {
      asset = await persistGenerationAsset(context, user.id, generationId, urls[0]);
    } catch (error) {
      console.error("generation_asset_persist_failed", {
        requestId,
        userId: user.id,
        generationId,
        error: error instanceof Error ? error.message : "unknown_error",
      });
    }
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

    return context.json(responsePayload, 200);
  } catch (error) {
    await safelyMarkGenerationFailed({
      db,
      userId: user.id,
      generationId,
      errorCode:
        error instanceof DashScopeRequestError ? error.backendCode : "INTERNAL_SERVER_ERROR",
      errorMessage:
        error instanceof DashScopeRequestError ? error.message : "Internal server error.",
      requestId,
    });

    if (creditsWereReserved) {
      await safelyRefundCredit({
        db,
        d1: context.env.DB,
        userId: user.id,
        workflow: "image-from-text",
        requestId,
      });
    }
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

  const resolvedReference = await resolveReferenceImageForProvider({
    context,
    db,
    userId: user.id,
    requestUrl: context.req.url,
    referenceImage: normalized.data.referenceImage,
  });
  if (!resolvedReference.success) {
    if (resolvedReference.errorType === "backend") {
      return backendConfigError(context, requestId, resolvedReference.message);
    }
    return validationError(context, requestId, resolvedReference.message);
  }

  const productShootContext = parseProductShootContext(body.data);
  const productShootRunId = productShootContext?.runId ?? null;
  const existingRunSourceR2Key = productShootRunId
    ? await getProductShootRunSourceR2Key(db, user.id, productShootRunId)
    : null;

  if (productShootRunId && !existingRunSourceR2Key && !context.env.GENERATIONS_BUCKET) {
    return backendConfigError(context, requestId, "GENERATIONS_BUCKET is not configured.");
  }

  const { reservation: creditReservation, creditsWereReserved } = await reserveCreditsForWorkflow({
    env: context.env,
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
      referenceImage: serializeReferenceForHistory(normalized.data.referenceImage),
      parameters: {
        ...normalized.data,
        referenceImage: serializeReferenceForHistory(normalized.data.referenceImage),
        referenceImageSource: resolvedReference.source,
      },
      ...(productShootContext ? { productShootContext } : {}),
    },
  });

  try {
    let productShootSourceR2Key = existingRunSourceR2Key;
    if (
      productShootRunId &&
      !productShootSourceR2Key &&
      resolvedReference.source === "provided-data-url"
    ) {
      const persistedRunSource = await persistReferenceAsset(
        context,
        user.id,
        productShootRunId,
        resolvedReference.referenceImageDataUrl,
      );
      if (!persistedRunSource) {
        throw new Error("PRODUCT_SHOOT_SOURCE_PERSISTENCE_FAILED");
      }
      productShootSourceR2Key = persistedRunSource.r2Key;
    }
    const providerBody = {
      model: config.data.imageEditModel,
      input: {
        messages: [
          {
            role: "user",
            content: [
              { image: resolvedReference.referenceImageDataUrl },
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

    let asset: Awaited<ReturnType<typeof persistGenerationAsset>> = null;
    try {
      asset = await persistGenerationAsset(context, user.id, generationId, urls[0]);
    } catch (error) {
      console.error("generation_asset_persist_failed", {
        requestId,
        userId: user.id,
        generationId,
        error: error instanceof Error ? error.message : "unknown_error",
      });
    }
    if (productShootRunId && !productShootSourceR2Key) {
      const persistedRunSource = await persistReferenceAsset(
        context,
        user.id,
        productShootRunId,
        resolvedReference.referenceImageDataUrl,
      );
      if (!persistedRunSource) {
        throw new Error("PRODUCT_SHOOT_SOURCE_PERSISTENCE_FAILED");
      }
      productShootSourceR2Key = persistedRunSource.r2Key;
    }

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
        sourceR2Key: productShootSourceR2Key,
        sourceAssetUrl:
          productShootRunId && productShootSourceR2Key
            ? `/api/product-shoots/runs/${productShootRunId}/source`
            : null,
      },
    });

    return context.json(responsePayload, 200);
  } catch (error) {
    await safelyMarkGenerationFailed({
      db,
      userId: user.id,
      generationId,
      errorCode:
        error instanceof DashScopeRequestError ? error.backendCode : "INTERNAL_SERVER_ERROR",
      errorMessage:
        error instanceof DashScopeRequestError ? error.message : "Internal server error.",
      requestId,
    });

    if (creditsWereReserved) {
      await safelyRefundCredit({
        db,
        d1: context.env.DB,
        userId: user.id,
        workflow: "image-from-reference",
        requestId,
      });
    }
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

  const { reservation: creditReservation, creditsWereReserved } = await reserveCreditsForWorkflow({
    env: context.env,
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
      referenceImageUrl: serializeReferenceForHistory(referenceImageUrl),
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
    if (creditsWereReserved) {
      await safelyRefundCredit({
        db,
        d1: context.env.DB,
        userId: user.id,
        workflow: "video-from-reference",
        requestId,
      });
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
    items: rows.map((row) => mapHistorySummary(row)),
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

  return context.json({ item: mapHistoryDetail(row) });
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

app.get("/api/product-shoots/runs", requireAuth, async (context) => {
  const user = context.get("user");
  const db = createDb(context.env.DB);
  const limit = parsePositiveInt(
    context.req.query("limit"),
    PRODUCT_SHOOT_RUN_LIMIT_DEFAULT,
    1,
    PRODUCT_SHOOT_RUN_LIMIT_MAX,
  );
  const offset = parsePositiveInt(context.req.query("offset"), 0, 0, 10_000);

  const rows = await db
    .select()
    .from(schema.generation)
    .where(
      and(
        eq(schema.generation.userId, user.id),
        eq(schema.generation.workflow, "image-from-reference"),
        eq(schema.generation.status, "succeeded"),
      ),
    )
    .orderBy(desc(schema.generation.createdAt))
    .limit(400);

  const groupedRuns = groupProductShootRuns(rows);
  const pagedRuns = groupedRuns.slice(offset, offset + limit);
  const nextOffset = offset + pagedRuns.length < groupedRuns.length ? offset + limit : null;

  return context.json({
    items: pagedRuns,
    pagination: {
      limit,
      offset,
      total: groupedRuns.length,
      nextOffset,
    },
  });
});

app.get("/api/product-shoots/runs/:runId", requireAuth, async (context) => {
  const user = context.get("user");
  const db = createDb(context.env.DB);
  const runId = context.req.param("runId");

  const rows = await db
    .select()
    .from(schema.generation)
    .where(
      and(
        eq(schema.generation.userId, user.id),
        eq(schema.generation.workflow, "image-from-reference"),
        eq(schema.generation.status, "succeeded"),
      ),
    )
    .orderBy(desc(schema.generation.createdAt))
    .limit(400);

  const groupedRuns = groupProductShootRuns(rows);
  const run = groupedRuns.find((item) => item.runId === runId) ?? null;
  if (!run) {
    return context.json({ error: "Product shoot run not found." }, 404);
  }

  return context.json({ item: run });
});

app.get("/api/product-shoots/runs/:runId/source", requireAuth, async (context) => {
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
  const runId = context.req.param("runId");
  const sourceR2Key = await getProductShootRunSourceR2Key(db, user.id, runId);
  if (!sourceR2Key) {
    return context.json({ error: "Product shoot source image not found." }, 404);
  }

  const asset = await bucket.get(sourceR2Key);
  if (!asset?.body) {
    return context.json({ error: "Product shoot source image not found." }, 404);
  }

  return new Response(asset.body, {
    headers: {
      "content-type": asset.httpMetadata?.contentType || "application/octet-stream",
      "cache-control": "private, max-age=3600",
    },
  });
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

async function persistReferenceAsset(
  context: Context<{ Bindings: Bindings; Variables: Variables }>,
  userId: string,
  runId: string,
  referenceImage: string,
) {
  if (!context.env.GENERATIONS_BUCKET) {
    return null;
  }

  return uploadReferenceAsset({
    bucket: context.env.GENERATIONS_BUCKET,
    referenceImage,
    userId,
    runId,
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

function mapHistorySummary(row: HistorySummaryRow) {
  const output = parseJsonText(row.outputJson);
  const fallbackImageUrl = extractFirstImageUrl(output);
  const assetUrl = row.r2Key ? `/api/history/${row.id}/asset` : fallbackImageUrl;

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

function mapHistoryDetail(row: HistorySummaryRow) {
  const output = parseJsonText(row.outputJson);
  const input = parseJsonText(row.inputJson);

  return {
    ...mapHistorySummary(row),
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
  if (typeof first === "string" && first.trim().length > 0) {
    return first;
  }
  if (isRecord(first)) {
    const url = first.url;
    return typeof url === "string" && url.trim().length > 0 ? url : null;
  }
  return null;
}

function groupProductShootRuns(rows: HistorySummaryRow[]): ProductShootRunSummary[] {
  const groupedRuns = new Map<
    string,
    {
      runId: string;
      templates: ProductShootTemplateSnapshot[];
      aspectRatioId: string | null;
      sourceImageUrl: string | null;
      createdAt: Date | null;
      updatedAt: Date | null;
      outputs: Array<{
        generationId: string;
        templateId: string;
        templateLabel: string;
        imageUrl: string | null;
        createdAt: Date | null;
      }>;
    }
  >();

  for (const row of rows) {
    const parsedInput = parseJsonText(row.inputJson);
    const parsedOutput = parseJsonText(row.outputJson);
    const contextValue = readProductShootContext(parsedInput);
    if (!contextValue) {
      continue;
    }

    const currentGroup = groupedRuns.get(contextValue.runId);
    const nextSourceImageUrl =
      readSourceAssetUrl(parsedOutput) ?? readReferenceImageFromInput(parsedInput);
    const outputImageUrl = resolveGenerationImageUrl(row, parsedOutput);
    const outputTemplateLabel = contextValue.templateLabel.trim();

    if (!currentGroup) {
      groupedRuns.set(contextValue.runId, {
        runId: contextValue.runId,
        templates: contextValue.selectedTemplates,
        aspectRatioId: contextValue.aspectRatioId ?? null,
        sourceImageUrl: nextSourceImageUrl,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        outputs: [
          {
            generationId: row.id,
            templateId: contextValue.templateId,
            templateLabel: outputTemplateLabel,
            imageUrl: outputImageUrl,
            createdAt: row.createdAt,
          },
        ],
      });
      continue;
    }

    if (row.createdAt && (!currentGroup.createdAt || row.createdAt < currentGroup.createdAt)) {
      currentGroup.createdAt = row.createdAt;
    }

    if (row.updatedAt && (!currentGroup.updatedAt || row.updatedAt > currentGroup.updatedAt)) {
      currentGroup.updatedAt = row.updatedAt;
    }

    if (!currentGroup.sourceImageUrl && nextSourceImageUrl) {
      currentGroup.sourceImageUrl = nextSourceImageUrl;
    }

    if (
      currentGroup.templates.length === 0 &&
      Array.isArray(contextValue.selectedTemplates) &&
      contextValue.selectedTemplates.length > 0
    ) {
      currentGroup.templates = contextValue.selectedTemplates;
    }

    if (!currentGroup.aspectRatioId && contextValue.aspectRatioId) {
      currentGroup.aspectRatioId = contextValue.aspectRatioId;
    }

    currentGroup.outputs.push({
      generationId: row.id,
      templateId: contextValue.templateId,
      templateLabel: outputTemplateLabel,
      imageUrl: outputImageUrl,
      createdAt: row.createdAt,
    });
  }

  const groups = Array.from(groupedRuns.values());
  for (const group of groups) {
    const templateOrderMap = new Map(
      group.templates.map((template, index) => [template.id, index]),
    );
    group.outputs.sort((left, right) => {
      const leftOrder = templateOrderMap.get(left.templateId) ?? Number.MAX_SAFE_INTEGER;
      const rightOrder = templateOrderMap.get(right.templateId) ?? Number.MAX_SAFE_INTEGER;
      if (leftOrder !== rightOrder) {
        return leftOrder - rightOrder;
      }

      const leftTime = left.createdAt?.getTime() ?? 0;
      const rightTime = right.createdAt?.getTime() ?? 0;
      return leftTime - rightTime;
    });
  }

  groups.sort((left, right) => {
    const leftTime = left.updatedAt?.getTime() ?? 0;
    const rightTime = right.updatedAt?.getTime() ?? 0;
    return rightTime - leftTime;
  });

  return groups.map((group) => ({
    runId: group.runId,
    createdAt: toIsoString(group.createdAt),
    updatedAt: toIsoString(group.updatedAt),
    sourceImageUrl: group.sourceImageUrl,
    templates: group.templates,
    outputCount: group.outputs.length,
    outputs: group.outputs.map((output) => ({
      generationId: output.generationId,
      templateId: output.templateId,
      templateLabel: output.templateLabel,
      imageUrl: output.imageUrl,
      createdAt: toIsoString(output.createdAt),
    })),
    aspectRatioId: group.aspectRatioId,
  }));
}

function resolveGenerationImageUrl(row: HistorySummaryRow, parsedOutput: unknown): string | null {
  if (row.r2Key) {
    return `/api/history/${row.id}/asset`;
  }

  return extractFirstImageUrl(parsedOutput);
}

function readSourceAssetUrl(output: unknown): string | null {
  if (!isRecord(output)) {
    return null;
  }

  const value = output.sourceAssetUrl;
  if (typeof value !== "string" || value.trim().length === 0) {
    return null;
  }

  if (
    INTERNAL_HISTORY_ASSET_PATH_PATTERN.test(value) ||
    INTERNAL_PRODUCT_SHOOT_SOURCE_PATH_PATTERN.test(value)
  ) {
    return value;
  }

  try {
    const parsed = new URL(value);
    if (
      INTERNAL_HISTORY_ASSET_PATH_PATTERN.test(parsed.pathname) ||
      INTERNAL_PRODUCT_SHOOT_SOURCE_PATH_PATTERN.test(parsed.pathname)
    ) {
      return `${parsed.pathname}${parsed.search}`;
    }
    return parsed.protocol === "http:" || parsed.protocol === "https:" ? value : null;
  } catch {
    return null;
  }
}

function readSourceR2Key(output: unknown): string | null {
  if (!isRecord(output)) {
    return null;
  }

  const value = output.sourceR2Key;
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function readReferenceImageFromInput(input: unknown): string | null {
  if (!isRecord(input)) {
    return null;
  }

  const value = input.referenceImage;
  if (typeof value !== "string" || value.trim().length === 0) {
    return null;
  }

  if (value.startsWith("[omitted:data-url")) {
    return null;
  }

  if (
    INTERNAL_HISTORY_ASSET_PATH_PATTERN.test(value) ||
    INTERNAL_PRODUCT_SHOOT_SOURCE_PATH_PATTERN.test(value)
  ) {
    return value;
  }

  try {
    const url = new URL(value);
    if (
      INTERNAL_HISTORY_ASSET_PATH_PATTERN.test(url.pathname) ||
      INTERNAL_PRODUCT_SHOOT_SOURCE_PATH_PATTERN.test(url.pathname)
    ) {
      return `${url.pathname}${url.search}`;
    }
    if (url.protocol === "http:" || url.protocol === "https:") {
      return value;
    }
    return null;
  } catch {
    return null;
  }
}

async function getProductShootRunSourceR2Key(
  db: ReturnType<typeof createDb>,
  userId: string,
  runId: string,
): Promise<string | null> {
  const rows = await db
    .select({
      inputJson: schema.generation.inputJson,
      outputJson: schema.generation.outputJson,
    })
    .from(schema.generation)
    .where(
      and(
        eq(schema.generation.userId, userId),
        eq(schema.generation.workflow, "image-from-reference"),
        eq(schema.generation.status, "succeeded"),
      ),
    )
    .orderBy(desc(schema.generation.createdAt))
    .limit(400);

  for (const row of rows) {
    const parsedInput = parseJsonText(row.inputJson);
    const contextValue = readProductShootContext(parsedInput);
    if (!contextValue || contextValue.runId !== runId) {
      continue;
    }

    const parsedOutput = parseJsonText(row.outputJson);
    const sourceR2Key = readSourceR2Key(parsedOutput);
    if (sourceR2Key) {
      return sourceR2Key;
    }
  }

  return null;
}

async function resolveReferenceImageForProvider(args: {
  context: Context<{ Bindings: Bindings; Variables: Variables }>;
  db: ReturnType<typeof createDb>;
  userId: string;
  requestUrl: string;
  referenceImage: string;
}): Promise<
  | {
      success: true;
      referenceImageDataUrl: string;
      source: ReferenceImageResolutionSource;
    }
  | {
      success: false;
      errorType: "validation" | "backend";
      message: string;
    }
> {
  const rawReference = args.referenceImage.trim();
  const isRelativeReference = rawReference.startsWith("/");
  const isDataUrlCandidate = rawReference.startsWith("data:");
  const dataUrlAsset = parseImageDataUrl(rawReference);
  if (dataUrlAsset) {
    if (dataUrlAsset.bytes.byteLength > MAX_REFERENCE_IMAGE_BYTES) {
      return {
        success: false,
        errorType: "validation",
        message: "Reference image must be 10MB or smaller.",
      };
    }

    return {
      success: true,
      referenceImageDataUrl: buildImageDataUrl(dataUrlAsset.contentType, dataUrlAsset.bytes),
      source: "provided-data-url",
    };
  }

  if (isDataUrlCandidate) {
    return {
      success: false,
      errorType: "validation",
      message: "referenceImageUrl data URL is invalid or exceeds the 10MB size limit.",
    };
  }

  let referenceUrl: URL;
  try {
    referenceUrl = isRelativeReference
      ? new URL(rawReference, args.requestUrl)
      : new URL(rawReference);
  } catch {
    return {
      success: false,
      errorType: "validation",
      message:
        "referenceImageUrl must be an http(s) URL, a supported internal /api URL, or Base64 data URL.",
    };
  }

  if (referenceUrl.protocol !== "http:" && referenceUrl.protocol !== "https:") {
    return {
      success: false,
      errorType: "validation",
      message: "referenceImageUrl must use http or https.",
    };
  }

  const requestUrl = new URL(args.requestUrl);
  const internalTarget = parseInternalReferenceTarget(referenceUrl, requestUrl);
  if (isRelativeReference && !internalTarget) {
    return {
      success: false,
      errorType: "validation",
      message:
        "Unsupported internal reference path. Use /api/history/:id/asset or /api/product-shoots/runs/:runId/source.",
    };
  }

  if (isSameServiceOrigin(referenceUrl, requestUrl) && !internalTarget) {
    return {
      success: false,
      errorType: "validation",
      message:
        "Unsupported internal reference URL. Use /api/history/:id/asset or /api/product-shoots/runs/:runId/source.",
    };
  }

  if (internalTarget) {
    const bucket = args.context.env.GENERATIONS_BUCKET;
    if (!bucket) {
      return {
        success: false,
        errorType: "backend",
        message: "GENERATIONS_BUCKET is not configured.",
      };
    }

    if (internalTarget.kind === "history-asset") {
      const row = await getGenerationForUser(args.db, args.userId, internalTarget.generationId);
      if (!row?.r2Key) {
        return {
          success: false,
          errorType: "validation",
          message: "The selected image is no longer available.",
        };
      }

      const asset = await bucket.get(row.r2Key);
      const mapped = await readR2ImageAsset(asset, row.r2Key);
      if (!mapped) {
        return {
          success: false,
          errorType: "validation",
          message: "The selected image is no longer available.",
        };
      }

      if (mapped.bytes.byteLength > MAX_REFERENCE_IMAGE_BYTES) {
        return {
          success: false,
          errorType: "validation",
          message: "Reference image must be 10MB or smaller.",
        };
      }

      return {
        success: true,
        referenceImageDataUrl: buildImageDataUrl(mapped.contentType, mapped.bytes),
        source: "internal-history-asset",
      };
    }

    const sourceR2Key = await getProductShootRunSourceR2Key(
      args.db,
      args.userId,
      internalTarget.runId,
    );
    if (!sourceR2Key) {
      return {
        success: false,
        errorType: "validation",
        message: "The selected source image is no longer available.",
      };
    }

    const sourceAsset = await bucket.get(sourceR2Key);
    const mappedSource = await readR2ImageAsset(sourceAsset, sourceR2Key);
    if (!mappedSource) {
      return {
        success: false,
        errorType: "validation",
        message: "The selected source image is no longer available.",
      };
    }

    if (mappedSource.bytes.byteLength > MAX_REFERENCE_IMAGE_BYTES) {
      return {
        success: false,
        errorType: "validation",
        message: "Reference image must be 10MB or smaller.",
      };
    }

    return {
      success: true,
      referenceImageDataUrl: buildImageDataUrl(mappedSource.contentType, mappedSource.bytes),
      source: "internal-run-source",
    };
  }

  if (isDisallowedExternalReferenceHost(referenceUrl.hostname)) {
    return {
      success: false,
      errorType: "validation",
      message:
        "referenceImageUrl host is not allowed. Use an uploaded image or a public image URL.",
    };
  }

  const externalAsset = await fetchExternalImageAsset(referenceUrl);
  if (!externalAsset.success) {
    return externalAsset;
  }

  return {
    success: true,
    referenceImageDataUrl: buildImageDataUrl(externalAsset.contentType, externalAsset.bytes),
    source: "external-url",
  };
}

function parseInternalReferenceTarget(
  referenceUrl: URL,
  requestUrl: URL,
): { kind: "history-asset"; generationId: string } | { kind: "run-source"; runId: string } | null {
  if (!isSameServiceOrigin(referenceUrl, requestUrl)) {
    return null;
  }

  const historyMatch = INTERNAL_HISTORY_ASSET_PATH_PATTERN.exec(referenceUrl.pathname);
  if (historyMatch?.[1]) {
    return { kind: "history-asset", generationId: historyMatch[1] };
  }

  const runSourceMatch = INTERNAL_PRODUCT_SHOOT_SOURCE_PATH_PATTERN.exec(referenceUrl.pathname);
  if (runSourceMatch?.[1]) {
    return { kind: "run-source", runId: runSourceMatch[1] };
  }

  return null;
}

function isSameServiceOrigin(referenceUrl: URL, requestUrl: URL): boolean {
  if (referenceUrl.origin === requestUrl.origin) {
    return true;
  }

  const referencePort = normalizePort(referenceUrl);
  const requestPort = normalizePort(requestUrl);
  if (referencePort !== requestPort) {
    return false;
  }

  return (
    isLoopbackHost(referenceUrl.hostname.toLowerCase()) &&
    isLoopbackHost(requestUrl.hostname.toLowerCase())
  );
}

function normalizePort(url: URL): string {
  if (url.port) {
    return url.port;
  }
  return url.protocol === "https:" ? "443" : "80";
}

function isLoopbackHost(hostname: string): boolean {
  return hostname === "localhost" || hostname === "::1" || hostname.startsWith("127.");
}

function isDisallowedExternalReferenceHost(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  if (
    isLoopbackHost(lower) ||
    lower === "0.0.0.0" ||
    lower.endsWith(".localhost") ||
    lower.endsWith(".local") ||
    lower.endsWith(".internal")
  ) {
    return true;
  }

  return isIpLiteralHost(lower);
}

function isIpLiteralHost(hostname: string): boolean {
  return isIpv4Literal(hostname) || hostname.includes(":");
}

function isIpv4Literal(hostname: string): boolean {
  const parts = hostname.split(".");
  if (parts.length !== 4) {
    return false;
  }

  return parts.every((part) => {
    if (!/^\d+$/.test(part)) {
      return false;
    }

    const value = Number.parseInt(part, 10);
    return value >= 0 && value <= 255;
  });
}

async function fetchExternalImageAsset(referenceUrl: URL): Promise<
  | {
      success: true;
      bytes: Uint8Array;
      contentType: string;
    }
  | {
      success: false;
      errorType: "validation";
      message: string;
    }
> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REFERENCE_IMAGE_FETCH_TIMEOUT_MS);

  try {
    let currentUrl = new URL(referenceUrl.toString());
    let response: Response | null = null;

    for (let redirects = 0; redirects <= MAX_REFERENCE_IMAGE_REDIRECTS; redirects += 1) {
      response = await fetch(currentUrl.toString(), {
        signal: controller.signal,
        redirect: "manual",
      });

      if (isRedirectStatus(response.status)) {
        if (redirects === MAX_REFERENCE_IMAGE_REDIRECTS) {
          return {
            success: false,
            errorType: "validation",
            message: "referenceImageUrl has too many redirects.",
          };
        }

        const location = response.headers.get("location");
        if (!location) {
          return {
            success: false,
            errorType: "validation",
            message: "referenceImageUrl redirect is missing a location header.",
          };
        }

        let nextUrl: URL;
        try {
          nextUrl = new URL(location, currentUrl);
        } catch {
          return {
            success: false,
            errorType: "validation",
            message: "referenceImageUrl redirect target is invalid.",
          };
        }

        if (nextUrl.protocol !== "http:" && nextUrl.protocol !== "https:") {
          return {
            success: false,
            errorType: "validation",
            message: "referenceImageUrl redirect target must use http or https.",
          };
        }

        if (isDisallowedExternalReferenceHost(nextUrl.hostname)) {
          return {
            success: false,
            errorType: "validation",
            message:
              "referenceImageUrl redirect target host is not allowed. Use a public image URL.",
          };
        }

        currentUrl = nextUrl;
        continue;
      }

      break;
    }

    if (!response) {
      return {
        success: false,
        errorType: "validation",
        message: "Could not download reference image from URL.",
      };
    }

    if (!response.ok) {
      return {
        success: false,
        errorType: "validation",
        message: "Could not download reference image from URL.",
      };
    }

    const contentLength = Number.parseInt(response.headers.get("content-length") || "", 10);
    if (Number.isFinite(contentLength) && contentLength > MAX_REFERENCE_IMAGE_BYTES) {
      return {
        success: false,
        errorType: "validation",
        message: "Reference image must be 10MB or smaller.",
      };
    }

    const contentType =
      normalizeImageContentType(response.headers.get("content-type")) ??
      inferImageContentTypeFromPath(currentUrl.pathname);
    if (!contentType) {
      return {
        success: false,
        errorType: "validation",
        message: "referenceImageUrl must point to an image resource.",
      };
    }

    const bytes = await readResponseBytesWithLimit(response, MAX_REFERENCE_IMAGE_BYTES);
    if (!bytes) {
      return {
        success: false,
        errorType: "validation",
        message: "Reference image must be 10MB or smaller.",
      };
    }

    if (bytes.byteLength === 0) {
      return {
        success: false,
        errorType: "validation",
        message: "Could not read reference image bytes.",
      };
    }

    if (bytes.byteLength > MAX_REFERENCE_IMAGE_BYTES) {
      return {
        success: false,
        errorType: "validation",
        message: "Reference image must be 10MB or smaller.",
      };
    }

    return {
      success: true,
      bytes,
      contentType,
    };
  } catch {
    return {
      success: false,
      errorType: "validation",
      message: "Could not download reference image from URL.",
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

async function readR2ImageAsset(
  asset: R2ObjectBody | null,
  key: string,
): Promise<{ bytes: Uint8Array; contentType: string } | null> {
  if (!asset?.body) {
    return null;
  }
  if (asset.size > MAX_REFERENCE_IMAGE_BYTES) {
    return null;
  }

  const contentType =
    normalizeImageContentType(asset.httpMetadata?.contentType) ??
    inferImageContentTypeFromPath(key);
  if (!contentType) {
    return null;
  }

  const bytes = new Uint8Array(await asset.arrayBuffer());
  if (bytes.byteLength === 0) {
    return null;
  }

  return { bytes, contentType };
}

async function readResponseBytesWithLimit(
  response: Response,
  maxBytes: number,
): Promise<Uint8Array | null> {
  if (!response.body) {
    return null;
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    if (!value) {
      continue;
    }

    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      return null;
    }

    chunks.push(value);
  }

  const output = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return output;
}

function isRedirectStatus(status: number): boolean {
  return status === 301 || status === 302 || status === 303 || status === 307 || status === 308;
}

function normalizeImageContentType(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const normalized = value.split(";")[0]?.trim().toLowerCase();
  if (!normalized || !normalized.startsWith("image/")) {
    return null;
  }

  const canonical = REFERENCE_IMAGE_CONTENT_TYPE_ALIASES[normalized] ?? normalized;
  if (!SUPPORTED_REFERENCE_IMAGE_CONTENT_TYPES.has(canonical)) {
    return null;
  }

  return canonical;
}

function inferImageContentTypeFromPath(pathname: string): string | null {
  const value = pathname.toLowerCase();
  if (value.endsWith(".png")) return "image/png";
  if (value.endsWith(".jpg") || value.endsWith(".jpeg")) return "image/jpeg";
  if (value.endsWith(".webp")) return "image/webp";
  if (value.endsWith(".gif")) return "image/gif";
  if (value.endsWith(".bmp")) return "image/bmp";
  if (value.endsWith(".tif") || value.endsWith(".tiff")) return "image/tiff";
  return null;
}

function parseImageDataUrl(value: string): { bytes: Uint8Array; contentType: string } | null {
  const match = /^data:([^;,]+)?;base64,([\s\S]+)$/i.exec(value);
  if (!match) {
    return null;
  }

  const contentType = normalizeImageContentType(match[1]?.trim().toLowerCase() ?? "");
  if (!contentType) {
    return null;
  }

  const base64Payload = match[2]?.replace(/\s/g, "");
  if (!base64Payload) {
    return null;
  }

  const approxByteLength = Math.floor((base64Payload.length * 3) / 4);
  if (approxByteLength > MAX_REFERENCE_IMAGE_BYTES) {
    return null;
  }

  try {
    const binary = atob(base64Payload);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }
    return { bytes, contentType };
  } catch {
    return null;
  }
}

function buildImageDataUrl(contentType: string, bytes: Uint8Array): string {
  return `data:${contentType};base64,${Buffer.from(bytes).toString("base64")}`;
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

async function parseJsonBody(
  context: Context,
): Promise<{ success: true; data: unknown } | { success: false }> {
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

function parseProductShootContext(payload: unknown): ProductShootContext | null {
  if (!isRecord(payload)) {
    return null;
  }

  return readProductShootContext(payload);
}

function readProductShootContext(value: unknown): ProductShootContext | null {
  if (!isRecord(value)) {
    return null;
  }

  const candidate = value.productShootContext;
  if (!isRecord(candidate)) {
    return null;
  }

  const runId = normalizeRequiredContextString(candidate.runId);
  const templateId = normalizeRequiredContextString(candidate.templateId);
  const templateLabel = normalizeRequiredContextString(candidate.templateLabel);
  const selectedTemplates = normalizeTemplateSnapshots(candidate.selectedTemplates);

  if (!runId || !templateId || !templateLabel || selectedTemplates.length === 0) {
    return null;
  }

  const aspectRatioId = readString(candidate.aspectRatioId);

  return {
    runId,
    templateId,
    templateLabel,
    selectedTemplates,
    ...(aspectRatioId ? { aspectRatioId } : {}),
  };
}

function normalizeTemplateSnapshots(value: unknown): ProductShootTemplateSnapshot[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const seen = new Set<string>();
  const items: ProductShootTemplateSnapshot[] = [];
  for (const entry of value) {
    if (!isRecord(entry)) {
      continue;
    }

    const id = normalizeRequiredContextString(entry.id);
    const label = normalizeRequiredContextString(entry.label);
    if (!id || !label || seen.has(id)) {
      continue;
    }

    seen.add(id);
    items.push({ id, label });
  }

  return items;
}

function normalizeRequiredContextString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function serializeReferenceForHistory(reference: string): string {
  const trimmed = reference.trim();
  if (trimmed.startsWith("data:image/")) {
    return `[omitted:data-url length=${trimmed.length}]`;
  }
  return trimmed;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export default app;
