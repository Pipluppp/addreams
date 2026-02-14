import { z } from "zod";

const TEXT_IMAGE_ALLOWED_SIZES = [
  "1664*928",
  "1472*1104",
  "1328*1328",
  "1104*1472",
  "928*1664",
] as const;

const TEXT_IMAGE_SIZE_SET = new Set<string>(TEXT_IMAGE_ALLOWED_SIZES);
const LEGACY_TEXT_SIZE_REMAP: Record<string, (typeof TEXT_IMAGE_ALLOWED_SIZES)[number]> = {
  "1472*1140": "1472*1104",
  "1140*1472": "1104*1472",
};

const DATA_URL_PATTERN = /^data:image\/[a-z0-9.+-]+;base64,[a-z0-9+/=\s]+$/i;
const EDIT_SIZE_PATTERN = /^(\d+)\*(\d+)$/;

const contentPartSchema = z
  .object({
    type: z.string().optional(),
    text: z.string().optional(),
    image: z.string().optional(),
  })
  .passthrough();

const messageSchema = z
  .object({
    role: z.string().optional(),
    content: z.array(contentPartSchema).optional(),
  })
  .passthrough();

const payloadInputSchema = z
  .object({
    messages: z.array(messageSchema).optional(),
  })
  .passthrough();

const baseParametersSchema = z
  .object({
    n: z.number().int().optional(),
    size: z.string().optional(),
    negative_prompt: z.string().optional(),
    seed: z.number().int().min(0).max(2_147_483_647).optional(),
    prompt_extend: z.boolean().optional(),
    watermark: z.boolean().optional(),
    output_format: z.unknown().optional(),
    response_format: z.unknown().optional(),
  })
  .passthrough();

const imageFromTextSchema = z
  .object({
    prompt: z.string().optional(),
    model: z.unknown().optional(),
    size: z.string().optional(),
    n: z.number().int().optional(),
    negative_prompt: z.string().optional(),
    negativePrompt: z.string().optional(),
    seed: z.number().int().min(0).max(2_147_483_647).optional(),
    prompt_extend: z.boolean().optional(),
    promptExtend: z.boolean().optional(),
    watermark: z.boolean().optional(),
    input: payloadInputSchema.optional(),
    parameters: baseParametersSchema.optional(),
  })
  .passthrough();

const imageFromReferenceSchema = imageFromTextSchema
  .extend({
    referenceImageUrl: z.string().optional(),
  })
  .passthrough();

export type NormalizedImageFromTextInput = {
  prompt: string;
  n: 1;
  size?: (typeof TEXT_IMAGE_ALLOWED_SIZES)[number];
  negativePrompt?: string;
  seed?: number;
  promptExtend: boolean;
  watermark: boolean;
};

export type NormalizedImageFromReferenceInput = {
  prompt: string;
  referenceImage: string;
  n: number;
  size?: string;
  negativePrompt?: string;
  seed?: number;
  promptExtend: boolean;
  watermark: boolean;
};

type ValidationResult<T> = { success: true; data: T } | { success: false; message: string };

export function normalizeImageFromTextPayload(
  payload: unknown,
): ValidationResult<NormalizedImageFromTextInput> {
  const parsed = imageFromTextSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, message: formatSchemaError(parsed.error) };
  }

  const data = parsed.data;
  const content = data.input?.messages?.[0]?.content ?? [];
  const prompt = normalizeString(data.prompt) ?? extractFirstText(content);
  if (!prompt) {
    return { success: false, message: "prompt is required." };
  }

  const n = data.parameters?.n ?? data.n ?? 1;
  if (n !== 1) {
    return { success: false, message: "parameters.n must be 1 for image-from-text." };
  }

  const sizeInput = normalizeString(data.parameters?.size ?? data.size);
  const size = normalizeTextImageSize(sizeInput);
  if (sizeInput && !size) {
    return {
      success: false,
      message: `parameters.size must be one of: ${TEXT_IMAGE_ALLOWED_SIZES.join(", ")}.`,
    };
  }

  return {
    success: true,
    data: {
      prompt,
      n: 1,
      size,
      negativePrompt: normalizeString(
        data.parameters?.negative_prompt ?? data.negative_prompt ?? data.negativePrompt,
      ),
      seed: data.parameters?.seed ?? data.seed,
      promptExtend:
        data.parameters?.prompt_extend ?? data.prompt_extend ?? data.promptExtend ?? true,
      watermark: data.parameters?.watermark ?? data.watermark ?? false,
    },
  };
}

export function normalizeImageFromReferencePayload(
  payload: unknown,
): ValidationResult<NormalizedImageFromReferenceInput> {
  const parsed = imageFromReferenceSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, message: formatSchemaError(parsed.error) };
  }

  const data = parsed.data;
  const content = data.input?.messages?.[0]?.content ?? [];
  const prompt = normalizeString(data.prompt) ?? extractFirstText(content);
  if (!prompt) {
    return { success: false, message: "prompt is required." };
  }

  const explicitReference = normalizeString(data.referenceImageUrl);
  const contentReferences = extractImageParts(content);
  const allReferences = [
    ...(explicitReference ? [explicitReference] : []),
    ...contentReferences,
  ];
  const references = Array.from(new Set(allReferences));

  if (references.length === 0) {
    return { success: false, message: "referenceImageUrl is required." };
  }

  if (references.length !== 1) {
    return { success: false, message: "Exactly one reference image is supported." };
  }

  const referenceImage = references[0];
  if (!referenceImage) {
    return { success: false, message: "referenceImageUrl is required." };
  }
  if (!isValidReferenceImage(referenceImage)) {
    return {
      success: false,
      message: "referenceImageUrl must be an http(s) URL or Base64 data URL.",
    };
  }

  const n = data.parameters?.n ?? data.n ?? 1;
  if (!Number.isInteger(n) || n < 1 || n > 6) {
    return { success: false, message: "parameters.n must be between 1 and 6." };
  }

  const size = normalizeString(data.parameters?.size ?? data.size);
  if (size && !isValidEditSize(size)) {
    return {
      success: false,
      message: "parameters.size must match width*height with both values between 512 and 2048.",
    };
  }

  return {
    success: true,
    data: {
      prompt,
      referenceImage,
      n,
      size,
      negativePrompt: normalizeString(
        data.parameters?.negative_prompt ?? data.negative_prompt ?? data.negativePrompt,
      ),
      seed: data.parameters?.seed ?? data.seed,
      promptExtend:
        data.parameters?.prompt_extend ?? data.prompt_extend ?? data.promptExtend ?? true,
      watermark: data.parameters?.watermark ?? data.watermark ?? false,
    },
  };
}

function normalizeTextImageSize(
  size: string | undefined,
): (typeof TEXT_IMAGE_ALLOWED_SIZES)[number] | undefined {
  if (!size) return undefined;
  const remapped = LEGACY_TEXT_SIZE_REMAP[size] ?? size;
  if (!TEXT_IMAGE_SIZE_SET.has(remapped)) return undefined;
  return remapped as (typeof TEXT_IMAGE_ALLOWED_SIZES)[number];
}

function isValidEditSize(size: string): boolean {
  const match = EDIT_SIZE_PATTERN.exec(size);
  if (!match) return false;
  const widthRaw = match[1];
  const heightRaw = match[2];
  if (!widthRaw || !heightRaw) return false;
  const width = Number.parseInt(widthRaw, 10);
  const height = Number.parseInt(heightRaw, 10);
  if (!Number.isInteger(width) || !Number.isInteger(height)) return false;
  return width >= 512 && width <= 2048 && height >= 512 && height <= 2048;
}

function isValidReferenceImage(value: string): boolean {
  if (DATA_URL_PATTERN.test(value)) {
    return true;
  }

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function extractFirstText(
  content: Array<{ text?: string; image?: string; type?: string }>,
): string | undefined {
  for (const part of content) {
    const text = normalizeString(part.text);
    if (text) return text;
  }
  return undefined;
}

function extractImageParts(
  content: Array<{ text?: string; image?: string; type?: string }>,
): string[] {
  const images: string[] = [];
  for (const part of content) {
    const image = normalizeString(part.image);
    if (image) {
      images.push(image);
    }
  }
  return images;
}

function normalizeString(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function formatSchemaError(error: z.ZodError): string {
  const issue = error.issues[0];
  if (!issue) return "Invalid request payload.";
  const path = issue.path.length > 0 ? issue.path.join(".") : "body";
  return `${path}: ${issue.message}`;
}
