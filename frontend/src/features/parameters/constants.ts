export const QWEN_SIZE_PRESETS = [
  "1664*928",
  "1472*1140",
  "1328*1328",
  "1140*1472",
  "928*1664",
] as const;

export const OUTPUT_FORMATS = ["png", "jpg"] as const;

export const DEFAULT_SIZE_PRESET = "1328*1328" as const;

export const MAX_PROMPT_LENGTH = 500;
export const MAX_NEGATIVE_PROMPT_LENGTH = 500;

export const MIN_SEED_VALUE = 0;
export const MAX_SEED_VALUE = 2147483647;
