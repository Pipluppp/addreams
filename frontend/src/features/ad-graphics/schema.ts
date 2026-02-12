import {
  MAX_NEGATIVE_PROMPT_LENGTH,
  MAX_PROMPT_LENGTH,
  MAX_SEED_VALUE,
  MIN_SEED_VALUE,
} from "../parameters/constants";
import { isValidCustomSize, validateReferenceImageFile } from "../../lib/image-validation";

export type ReferenceMode = "upload" | "url";
export type SizeMode = "preset" | "custom";

export type AdGraphicsFormValues = {
  referenceMode: ReferenceMode;
  referenceImageUrl: string;
  referenceImageFile: File | null;
  prompt: string;
  negative_prompt: string;
  sizeMode: SizeMode;
  sizePreset: "1664*928" | "1472*1140" | "1328*1328" | "1140*1472" | "928*1664";
  customWidth: string;
  customHeight: string;
  seed: string;
  prompt_extend: boolean;
  watermark: boolean;
};

export type AdGraphicsField =
  | "referenceImage"
  | "referenceImageUrl"
  | "prompt"
  | "negative_prompt"
  | "seed"
  | "customSize";

export type AdGraphicsValidationErrors = Partial<Record<AdGraphicsField, string>>;

function isValidUrl(input: string): boolean {
  try {
    const parsed = new URL(input);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function parseInteger(input: string): number | undefined {
  const trimmed = input.trim();
  if (!trimmed.length) {
    return undefined;
  }

  const parsed = Number(trimmed);
  if (!Number.isInteger(parsed)) {
    return Number.NaN;
  }

  return parsed;
}

export function parseSeed(seedInput: string): number | undefined {
  return parseInteger(seedInput);
}

export function validateAdGraphicsForm(values: AdGraphicsFormValues) {
  const errors: AdGraphicsValidationErrors = {};

  if (values.referenceMode === "url") {
    if (!values.referenceImageUrl.trim().length) {
      errors.referenceImageUrl = "Reference image URL is required.";
    } else if (!isValidUrl(values.referenceImageUrl.trim())) {
      errors.referenceImageUrl = "Enter a valid http(s) URL.";
    }
  }

  if (values.referenceMode === "upload") {
    if (!values.referenceImageFile) {
      errors.referenceImage = "Select an image file to continue.";
    } else {
      const result = validateReferenceImageFile(values.referenceImageFile);
      if (!result.valid) {
        errors.referenceImage = result.error;
      }
    }
  }

  if (!values.prompt.trim().length) {
    errors.prompt = "Edit instruction is required.";
  } else if (values.prompt.length > MAX_PROMPT_LENGTH) {
    errors.prompt = `Instruction must be ${MAX_PROMPT_LENGTH} characters or less.`;
  }

  if (values.negative_prompt.length > MAX_NEGATIVE_PROMPT_LENGTH) {
    errors.negative_prompt = `Negative prompt must be ${MAX_NEGATIVE_PROMPT_LENGTH} characters or less.`;
  }

  const parsedSeed = parseSeed(values.seed);
  if (Number.isNaN(parsedSeed)) {
    errors.seed = "Seed must be an integer.";
  } else if (
    typeof parsedSeed === "number" &&
    (parsedSeed < MIN_SEED_VALUE || parsedSeed > MAX_SEED_VALUE)
  ) {
    errors.seed = `Seed must be between ${MIN_SEED_VALUE} and ${MAX_SEED_VALUE}.`;
  }

  if (values.sizeMode === "custom") {
    const width = parseInteger(values.customWidth);
    const height = parseInteger(values.customHeight);

    if (Number.isNaN(width) || Number.isNaN(height)) {
      errors.customSize = "Custom width and height must be integers.";
    } else if (typeof width !== "number" || typeof height !== "number") {
      errors.customSize = "Custom width and height are required.";
    } else {
      const sizeCheck = isValidCustomSize(width, height);
      if (!sizeCheck.valid) {
        errors.customSize = sizeCheck.error;
      }
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    seed: Number.isNaN(parsedSeed) ? undefined : parsedSeed,
  };
}
