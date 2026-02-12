import {
  MAX_NEGATIVE_PROMPT_LENGTH,
  MAX_PROMPT_LENGTH,
  MAX_SEED_VALUE,
  MIN_SEED_VALUE,
} from "../parameters/constants";

export type ProductShootsField = "prompt" | "negative_prompt" | "size" | "seed" | "output_format";

export type ProductShootsValidationErrors = Partial<Record<ProductShootsField, string>>;

export type ProductShootsFormValues = {
  prompt: string;
  negative_prompt: string;
  size: "1664*928" | "1472*1140" | "1328*1328" | "1140*1472" | "928*1664";
  seed: string;
  prompt_extend: boolean;
  watermark: boolean;
  output_format: "png" | "jpg";
};

export function parseSeedInput(seedInput: string): number | undefined {
  const trimmed = seedInput.trim();
  if (trimmed.length === 0) {
    return undefined;
  }

  const parsed = Number(trimmed);
  if (!Number.isInteger(parsed)) {
    return Number.NaN;
  }

  return parsed;
}

export function validateProductShootsForm(values: ProductShootsFormValues) {
  const errors: ProductShootsValidationErrors = {};

  if (values.prompt.trim().length === 0) {
    errors.prompt = "Prompt is required.";
  } else if (values.prompt.length > MAX_PROMPT_LENGTH) {
    errors.prompt = `Prompt must be ${MAX_PROMPT_LENGTH} characters or less.`;
  }

  if (values.negative_prompt.length > MAX_NEGATIVE_PROMPT_LENGTH) {
    errors.negative_prompt = `Negative prompt must be ${MAX_NEGATIVE_PROMPT_LENGTH} characters or less.`;
  }

  const parsedSeed = parseSeedInput(values.seed);
  if (Number.isNaN(parsedSeed)) {
    errors.seed = "Seed must be an integer.";
  } else if (
    typeof parsedSeed === "number" &&
    (parsedSeed < MIN_SEED_VALUE || parsedSeed > MAX_SEED_VALUE)
  ) {
    errors.seed = `Seed must be between ${MIN_SEED_VALUE} and ${MAX_SEED_VALUE}.`;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    seed: Number.isNaN(parsedSeed) ? undefined : parsedSeed,
  };
}
