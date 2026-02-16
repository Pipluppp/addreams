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

export type WorkflowOutputImage = {
  url: string;
};

export type WorkflowSuccessResponse = {
  workflow: "image-from-text" | "image-from-reference";
  status: "completed";
  requestId: string;
  generationId: string;
  provider: {
    name: "qwen";
    requestId?: string;
    model: string;
  };
  output: {
    images: WorkflowOutputImage[];
    expiresInHours: number;
  };
  credits: {
    productShoots: number;
    adGraphics: number;
  };
  usage?: {
    imageCount?: number;
    width?: number;
    height?: number;
  };
};

export type WorkflowLegacyStubResponse = {
  workflow: "image-from-text" | "image-from-reference" | "video-from-reference";
  status: "stub";
  requestId: string;
  generationId?: string;
  credits?: {
    productShoots: number;
    adGraphics: number;
  };
  receivedAt?: string;
};

export type WorkflowResponse = WorkflowSuccessResponse | WorkflowLegacyStubResponse;

export type GenerationStatus = "pending" | "succeeded" | "failed";

export type HistoryItem = {
  id: string;
  workflow: "image-from-text" | "image-from-reference" | "video-from-reference";
  status: GenerationStatus;
  createdAt: string | null;
  updatedAt: string | null;
  providerModel: string | null;
  providerRequestId: string | null;
  errorCode: string | null;
  errorMessage: string | null;
  r2Key: string | null;
  assetUrl: string | null;
};

export type HistoryListResponse = {
  items: HistoryItem[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
    nextOffset: number | null;
  };
};

export type HistoryDetailResponse = {
  item: HistoryItem & {
    input: unknown;
    output: unknown;
  };
};

export type HistoryDeleteResponse = {
  id: string;
  deleted: boolean;
};

export function isWorkflowCompletedResponse(
  response: WorkflowResponse,
): response is WorkflowSuccessResponse {
  return response.status === "completed";
}

export function getWorkflowOutputImages(response: WorkflowResponse): WorkflowOutputImage[] {
  if (!isWorkflowCompletedResponse(response)) return [];
  return response.output.images;
}

export type HealthResponse = {
  status: string;
  service: string;
  timestamp: string;
};

type HonoErrorPayload = {
  error?:
    | string
    | {
        code?: string;
        message?: string;
        providerCode?: string;
        providerRequestId?: string;
      };
  detail?: string;
  message?: string;
  requestId?: string;
};

export class ApiError extends Error {
  readonly status: number;
  readonly detail?: string;
  readonly code?: string;

  constructor(message: string, status: number, detail?: string, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
    this.code = code;
  }
}

const JSON_HEADERS = { "content-type": "application/json" };

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function normalizeError(status: number, payload: unknown): ApiError {
  if (isObject(payload)) {
    const data = payload as HonoErrorPayload;
    if (typeof data.error === "string") {
      return new ApiError(data.error, status, data.detail);
    }

    if (isObject(data.error)) {
      const code = typeof data.error.code === "string" ? data.error.code : undefined;
      const message =
        (typeof data.error.message === "string" ? data.error.message : undefined) ??
        data.message ??
        `Request failed with ${status}`;
      const details = [
        typeof data.error.code === "string" ? `code=${data.error.code}` : null,
        typeof data.error.providerCode === "string"
          ? `providerCode=${data.error.providerCode}`
          : null,
        typeof data.error.providerRequestId === "string"
          ? `providerRequestId=${data.error.providerRequestId}`
          : null,
        typeof data.requestId === "string" ? `requestId=${data.requestId}` : null,
      ]
        .filter(Boolean)
        .join(" ");

      return new ApiError(message, status, details || data.detail, code);
    }

    const message = data.message || `Request failed with ${status}`;
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
  init?: { method?: "GET" | "POST" | "DELETE"; body?: TBody },
): Promise<TResponse> {
  const response = await fetch(`${baseUrl}${path}`, {
    method: init?.method ?? "GET",
    headers: JSON_HEADERS,
    body: init?.body ? JSON.stringify(init.body) : undefined,
    credentials: "include",
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
      requestJson<WorkflowResponse, ProductShootsRequest>(
        baseUrl,
        "/workflows/image-from-text",
        {
          method: "POST",
          body: payload,
        },
      ),
    submitAdGraphics: (payload: AdGraphicsRequest) =>
      requestJson<WorkflowResponse, AdGraphicsRequest>(
        baseUrl,
        "/workflows/image-from-reference",
        {
          method: "POST",
          body: payload,
        },
      ),
    listHistory: (params?: {
      limit?: number;
      offset?: number;
      workflow?: WorkflowResponse["workflow"];
      status?: GenerationStatus;
    }) =>
      requestJson<HistoryListResponse>(
        baseUrl,
        `/history${params ? buildHistoryQuery(params) : ""}`,
      ),
    getHistory: (id: string) =>
      requestJson<HistoryDetailResponse>(baseUrl, `/history/${encodeURIComponent(id)}`),
    deleteHistory: (id: string) =>
      requestJson<HistoryDeleteResponse>(baseUrl, `/history/${encodeURIComponent(id)}`, {
        method: "DELETE",
      }),
  };
}

export const API_DEFAULTS = {
  productSizePreset: DEFAULT_SIZE_PRESET,
  outputFormat: OUTPUT_FORMATS[0],
  seedMin: MIN_SEED_VALUE,
  seedMax: MAX_SEED_VALUE,
};

function buildHistoryQuery(params: {
  limit?: number;
  offset?: number;
  workflow?: WorkflowResponse["workflow"];
  status?: GenerationStatus;
}): string {
  const search = new URLSearchParams();
  if (typeof params.limit === "number") {
    search.set("limit", String(params.limit));
  }
  if (typeof params.offset === "number") {
    search.set("offset", String(params.offset));
  }
  if (params.workflow) {
    search.set("workflow", params.workflow);
  }
  if (params.status) {
    search.set("status", params.status);
  }

  const query = search.toString();
  return query ? `?${query}` : "";
}
