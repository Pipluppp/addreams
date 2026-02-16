import { Hono } from "hono";
import type { Context } from "hono";
import { cors } from "hono/cors";
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
import {
  ensureUserProfile,
  refundCredit,
  reserveCredit,
  type CreditBalance,
  type CreditWorkflow,
} from "./lib/credits";

type Bindings = WorkerBindings & {
  DB: D1Database;
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

    return context.json(
      successPayload({
        workflow: "image-from-text",
        requestId,
        model: config.data.imageModel,
        providerPayload: providerResponse.payload,
        providerRequestId: providerResponse.providerRequestId,
        images: urls,
        credits: creditReservation.balance,
      }),
      200,
    );
  } catch (error) {
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

    return context.json(
      successPayload({
        workflow: "image-from-reference",
        requestId,
        model: config.data.imageEditModel,
        providerPayload: providerResponse.payload,
        providerRequestId: providerResponse.providerRequestId,
        images: urls,
        credits: creditReservation.balance,
      }),
      200,
    );
  } catch (error) {
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

  return stubResponse(context, "video-from-reference", creditReservation.balance);
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

function stubResponse(context: Context, workflow: WorkflowName, credits: CreditBalance) {
  return context.json(
    {
      workflow,
      status: "stub",
      requestId: crypto.randomUUID(),
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
