import { Hono } from "hono";
import type { Context } from "hono";
import { cors } from "hono/cors";

type Bindings = {
  QWEN_API_KEY?: string;
  QWEN_IMAGE_MODEL?: string;
  QWEN_VIDEO_MODEL?: string;
};

type WorkflowPayload = {
  prompt: string;
  referenceImageUrl?: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use("/api/*", cors());

app.get("/api/health", (context) =>
  context.json({
    status: "ok",
    service: "addreams-api",
    timestamp: new Date().toISOString(),
  }),
);

app.post("/api/workflows/image-from-text", async (context) => {
  const body = await parseJsonBody(context);
  if (!body) {
    return context.json({ error: "Invalid JSON payload" }, 400);
  }

  if (!isNonEmpty(body.prompt)) {
    return context.json({ error: "prompt is required" }, 400);
  }

  return stubResponse(context, "image-from-text");
});

app.post("/api/workflows/image-from-reference", async (context) => {
  const body = await parseJsonBody(context);
  if (!body) {
    return context.json({ error: "Invalid JSON payload" }, 400);
  }

  if (!isNonEmpty(body.prompt) || !isNonEmpty(body.referenceImageUrl)) {
    return context.json({ error: "prompt and referenceImageUrl are required" }, 400);
  }

  return stubResponse(context, "image-from-reference");
});

app.post("/api/workflows/video-from-reference", async (context) => {
  const body = await parseJsonBody(context);
  if (!body) {
    return context.json({ error: "Invalid JSON payload" }, 400);
  }

  if (!isNonEmpty(body.prompt) || !isNonEmpty(body.referenceImageUrl)) {
    return context.json({ error: "prompt and referenceImageUrl are required" }, 400);
  }

  return stubResponse(context, "video-from-reference");
});

app.onError((error, context) => {
  return context.json(
    {
      error: "Internal server error",
      detail: error.message,
    },
    500,
  );
});

app.notFound((context) => context.json({ error: "Not found" }, 404));

function isNonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

async function parseJsonBody(context: Context): Promise<WorkflowPayload | null> {
  try {
    const parsed = (await context.req.json()) as WorkflowPayload;
    return parsed;
  } catch {
    return null;
  }
}

function stubResponse(context: Context, workflow: string) {
  return context.json(
    {
      workflow,
      status: "stub",
      requestId: crypto.randomUUID(),
      receivedAt: new Date().toISOString(),
    },
    202,
  );
}

export default app;
