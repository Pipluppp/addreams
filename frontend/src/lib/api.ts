import {
  DEFAULT_SIZE_PRESET,
  MAX_SEED_VALUE,
  MIN_SEED_VALUE,
  OUTPUT_FORMATS,
  QWEN_SIZE_PRESETS,
} from "../features/parameters/constants";

type Role = "user" | "system";
type ContentTextPart = { type: "text"; text: string };
type ContentImagePart = { type: "image"; image: string };
type MessageContentPart = ContentTextPart | ContentImagePart;

export type QwenMessage = {
  role: Role;
  content: MessageContentPart[];
};

export type QwenSizePreset = (typeof QWEN_SIZE_PRESETS)[number];
export type OutputFormat = (typeof OUTPUT_FORMATS)[number];

export type BaseWorkflowParameters = {
  n: 1;
  negative_prompt?: string;
  seed?: number;
  prompt_extend: boolean;
  watermark: boolean;
};

export type ProductShootsParameters = BaseWorkflowParameters & {
  size: QwenSizePreset;
  output_format: OutputFormat;
  response_format?: "url" | "b64_json";
};

export type ProductShootsRequest = {
  prompt: string;
  model: string;
  input: {
    messages: [QwenMessage];
  };
  parameters: ProductShootsParameters;
};

export type AdGraphicsParameters = BaseWorkflowParameters & {
  size?: QwenSizePreset | `${number}*${number}`;
};

export type AdGraphicsRequest = {
  prompt: string;
  referenceImageUrl: string;
  model: string;
  input: {
    messages: [QwenMessage];
  };
  parameters: AdGraphicsParameters;
};

export type WorkflowStubResponse = {
  workflow: "image-from-text" | "image-from-reference" | "video-from-reference";
  status: "stub";
  requestId: string;
  receivedAt: string;
};

export type HealthResponse = {
  status: string;
  service: string;
  timestamp: string;
};

type HonoErrorPayload = {
  error?: string;
  detail?: string;
  message?: string;
};

export class ApiError extends Error {
  readonly status: number;
  readonly detail?: string;

  constructor(message: string, status: number, detail?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

const JSON_HEADERS = { "content-type": "application/json" };

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function normalizeError(status: number, payload: unknown): ApiError {
  if (isObject(payload)) {
    const data = payload as HonoErrorPayload;
    const message = data.error || data.message || `Request failed with ${status}`;
    return new ApiError(message, status, data.detail);
  }

  return new ApiError(`Request failed with ${status}`, status);
}

async function parseJsonSafely<T>(response: Response): Promise<T | null> {
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

async function requestJson<TResponse, TBody = undefined>(
  baseUrl: string,
  path: string,
  init?: { method?: "GET" | "POST"; body?: TBody },
): Promise<TResponse> {
  const response = await fetch(`${baseUrl}${path}`, {
    method: init?.method ?? "GET",
    headers: JSON_HEADERS,
    body: init?.body ? JSON.stringify(init.body) : undefined,
  });

  if (!response.ok) {
    const errorPayload = await parseJsonSafely<HonoErrorPayload>(response);
    throw normalizeError(response.status, errorPayload);
  }

  const payload = await parseJsonSafely<TResponse>(response);
  if (!payload) {
    throw new ApiError("Response body was empty or invalid JSON.", response.status);
  }

  return payload;
}

export type ApiClient = ReturnType<typeof createApiClient>;

export function createApiClient(baseUrl: string) {
  return {
    health: () => requestJson<HealthResponse>(baseUrl, "/health"),
    submitProductShoots: (payload: ProductShootsRequest) =>
      requestJson<WorkflowStubResponse, ProductShootsRequest>(
        baseUrl,
        "/workflows/image-from-text",
        {
          method: "POST",
          body: payload,
        },
      ),
    submitAdGraphics: (payload: AdGraphicsRequest) =>
      requestJson<WorkflowStubResponse, AdGraphicsRequest>(
        baseUrl,
        "/workflows/image-from-reference",
        {
          method: "POST",
          body: payload,
        },
      ),
  };
}

export const API_DEFAULTS = {
  productSizePreset: DEFAULT_SIZE_PRESET,
  outputFormat: OUTPUT_FORMATS[0],
  seedMin: MIN_SEED_VALUE,
  seedMax: MAX_SEED_VALUE,
};
