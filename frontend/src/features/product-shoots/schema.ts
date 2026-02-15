import { MAX_NEGATIVE_PROMPT_LENGTH, MAX_PROMPT_LENGTH } from "../parameters/constants";

export type ProductShootsField = "prompt" | "negative_prompt" | "size" | "output_format";

export type ProductShootsValidationErrors = Partial<Record<ProductShootsField, string>>;

export type ProductShootsFormValues = {
  prompt: string;
  negative_prompt: string;
  size: "1664*928" | "1472*1140" | "1328*1328" | "1140*1472" | "928*1664";
  watermark: boolean;
  output_format: "png" | "jpg";
};

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

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
