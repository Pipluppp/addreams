const DEFAULT_REGION = "sg";
const DEFAULT_TIMEOUT_MS = 45_000;
const DEFAULT_IMAGE_MODEL = "qwen-image-max";
const DEFAULT_IMAGE_EDIT_MODEL = "qwen-image-edit-max";

const DASHSCOPE_ENDPOINTS = {
  sg: "https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation",
  bj: "https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation",
} as const;

export type QwenRegion = keyof typeof DASHSCOPE_ENDPOINTS;

export type WorkerBindings = {
  QWEN_API_KEY?: string;
  QWEN_REGION?: string;
  QWEN_IMAGE_MODEL?: string;
  QWEN_IMAGE_EDIT_MODEL?: string;
  QWEN_TIMEOUT_MS?: string;
  QWEN_VIDEO_MODEL?: string;
};

export type QwenConfig = {
  apiKey: string;
  region: QwenRegion;
  imageModel: string;
  imageEditModel: string;
  timeoutMs: number;
};

type ProviderErrorInfo = {
  code?: string;
  message?: string;
  requestId?: string;
};

type ProviderCallArgs = {
  apiKey: string;
  region: QwenRegion;
  timeoutMs: number;
  body: unknown;
};

export type ConfigResult =
  | { success: true; data: QwenConfig }
  | { success: false; message: string };

export class DashScopeRequestError extends Error {
  readonly status: number;
  readonly backendCode: string;
  readonly providerCode?: string;
  readonly providerRequestId?: string;

  constructor(args: {
    status: number;
    backendCode: string;
    message: string;
    providerCode?: string;
    providerRequestId?: string;
  }) {
    super(args.message);
    this.name = "DashScopeRequestError";
    this.status = args.status;
    this.backendCode = args.backendCode;
    this.providerCode = args.providerCode;
    this.providerRequestId = args.providerRequestId;
  }
}

export function resolveQwenConfig(bindings: WorkerBindings): ConfigResult {
  const apiKey = bindings.QWEN_API_KEY?.trim();
  if (!apiKey) {
    return { success: false, message: "QWEN_API_KEY is not configured." };
  }

  const regionValue = bindings.QWEN_REGION?.trim().toLowerCase() ?? DEFAULT_REGION;
  if (regionValue !== "sg" && regionValue !== "bj") {
    return { success: false, message: "QWEN_REGION must be either 'sg' or 'bj'." };
  }

  const timeoutMs = parseTimeoutMs(bindings.QWEN_TIMEOUT_MS);
  if (!timeoutMs) {
    return { success: false, message: "QWEN_TIMEOUT_MS must be a positive integer." };
  }

  return {
    success: true,
    data: {
      apiKey,
      region: regionValue,
      timeoutMs,
      imageModel: bindings.QWEN_IMAGE_MODEL?.trim() || DEFAULT_IMAGE_MODEL,
      imageEditModel: bindings.QWEN_IMAGE_EDIT_MODEL?.trim() || DEFAULT_IMAGE_EDIT_MODEL,
    },
  };
}

export async function callDashScopeGeneration(args: ProviderCallArgs): Promise<{
  payload: unknown;
  providerRequestId?: string;
}> {
  const endpoint = DASHSCOPE_ENDPOINTS[args.region];
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), args.timeoutMs);

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${args.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(args.body),
      signal: controller.signal,
    });
  } catch (error) {
    if (isAbortError(error)) {
      throw new DashScopeRequestError({
        status: 504,
        backendCode: "UPSTREAM_TIMEOUT",
        message: "Image provider request timed out.",
      });
    }

    throw new DashScopeRequestError({
      status: 502,
      backendCode: "UPSTREAM_UNAVAILABLE",
      message: "Failed to connect to image provider.",
    });
  } finally {
    clearTimeout(timeoutId);
  }

  const payload = await parseJsonSafely(response);
  const providerError = readProviderError(payload);
  const providerRequestId =
    providerError.requestId ??
    getHeaderValue(response.headers, "x-request-id") ??
    getHeaderValue(response.headers, "x-acs-request-id") ??
    getHeaderValue(response.headers, "x-dashscope-request-id");

  if (!response.ok || providerError.code) {
    throw mapProviderError(response.status, providerError, providerRequestId);
  }

  if (!isRecord(payload)) {
    throw new DashScopeRequestError({
      status: 502,
      backendCode: "UPSTREAM_MALFORMED_RESPONSE",
      message: "Image provider returned an invalid response body.",
      providerRequestId,
    });
  }

  return { payload, providerRequestId };
}

function mapProviderError(
  status: number,
  providerError: ProviderErrorInfo,
  providerRequestId?: string,
): DashScopeRequestError {
  const providerCode = providerError.code;
  const requestId = providerError.requestId ?? providerRequestId;

  if (providerCode === "DataInspectionFailed") {
    return new DashScopeRequestError({
      status: 502,
      backendCode: "UPSTREAM_POLICY_VIOLATION",
      message: "Request was rejected by provider safety checks.",
      providerCode,
      providerRequestId: requestId,
    });
  }

  if (status >= 500) {
    return new DashScopeRequestError({
      status: 502,
      backendCode: "UPSTREAM_UNAVAILABLE",
      message: "Image provider is currently unavailable.",
      providerCode,
      providerRequestId: requestId,
    });
  }

  if (providerCode === "InvalidParameter") {
    return new DashScopeRequestError({
      status: 502,
      backendCode: "UPSTREAM_INVALID_PARAMETER",
      message: providerError.message ?? "Image provider rejected request parameters.",
      providerCode,
      providerRequestId: requestId,
    });
  }

  if (providerCode === "InvalidApiKey") {
    return new DashScopeRequestError({
      status: 502,
      backendCode: "UPSTREAM_AUTH_ERROR",
      message: "Image provider authentication failed.",
      providerCode,
      providerRequestId: requestId,
    });
  }

  if (status === 429) {
    return new DashScopeRequestError({
      status: 502,
      backendCode: "UPSTREAM_RATE_LIMITED",
      message: "Image provider rate limit exceeded.",
      providerCode,
      providerRequestId: requestId,
    });
  }

  return new DashScopeRequestError({
    status: 502,
    backendCode: "UPSTREAM_REQUEST_FAILED",
    message: providerError.message ?? "Image provider request failed.",
    providerCode,
    providerRequestId: requestId,
  });
}

function parseTimeoutMs(value: string | undefined): number | null {
  if (!value) return DEFAULT_TIMEOUT_MS;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) return null;
  return parsed;
}

function readProviderError(payload: unknown): ProviderErrorInfo {
  if (!isRecord(payload)) return {};
  return {
    code: readString(payload.code),
    message: readString(payload.message),
    requestId: readString(payload.request_id),
  };
}

async function parseJsonSafely(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

function getHeaderValue(headers: Headers, key: string): string | undefined {
  const value = headers.get(key);
  return value?.trim() || undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function readString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value : undefined;
}
