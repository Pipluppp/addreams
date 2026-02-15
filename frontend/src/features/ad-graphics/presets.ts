export type UseCasePreset = {
  id: string;
  label: string;
  description: string;
  positivePromptBase: string;
  negativePrompt: string;
  sizePreset: "1664*928" | "1472*1140" | "1328*1328" | "1140*1472" | "928*1664";
  promptExtend: boolean;
  promptHint: string;
};

const BASE_NEGATIVE =
  "low resolution, worst quality, low quality, blur, distortion, artifacts, disfigured, bad proportions, watermark, text overlay";

export const USE_CASE_PRESETS: UseCasePreset[] = [
  {
    id: "product-hero",
    label: "Product Hero Shot",
    description: "Clean, centered product image with studio quality",
    positivePromptBase:
      "Professional product hero shot, centered composition, studio quality, sharp focus, commercial photography",
    negativePrompt: BASE_NEGATIVE,
    sizePreset: "1328*1328",
    promptExtend: true,
    promptHint: "Add background, lighting, and styling details\u2026",
  },
  {
    id: "lifestyle-scene",
    label: "Lifestyle Scene",
    description: "Product in a natural, lifestyle context",
    positivePromptBase:
      "Lifestyle product photography, natural authentic setting, real-world context, editorial feel",
    negativePrompt: `${BASE_NEGATIVE}, generic stock photo, unnatural pose, flat lighting`,
    sizePreset: "1664*928",
    promptExtend: true,
    promptHint: "Describe the scene, setting, and mood\u2026",
  },
  {
    id: "social-square",
    label: "Social Post (Square)",
    description: "Square format optimized for social media feeds",
    positivePromptBase:
      "Eye-catching social media product image, vibrant colors, engaging composition, scroll-stopping visual",
    negativePrompt: BASE_NEGATIVE,
    sizePreset: "1328*1328",
    promptExtend: true,
    promptHint: "Describe the look and feel for your post\u2026",
  },
  {
    id: "social-story",
    label: "Story / Vertical",
    description: "Tall format for stories and reels",
    positivePromptBase:
      "Vertical product showcase, dynamic composition, bold and attention-grabbing, story-ready format",
    negativePrompt: BASE_NEGATIVE,
    sizePreset: "928*1664",
    promptExtend: true,
    promptHint: "Describe the vertical composition\u2026",
  },
  {
    id: "ecommerce-banner",
    label: "E-commerce Banner",
    description: "Wide banner format for shop headers and ads",
    positivePromptBase:
      "Professional e-commerce banner, clean product presentation, wide composition with breathing room, shop-ready",
    negativePrompt: BASE_NEGATIVE,
    sizePreset: "1472*1140",
    promptExtend: true,
    promptHint: "Describe the banner scene and product placement\u2026",
  },
  {
    id: "custom",
    label: "Custom",
    description: "Full control over all parameters",
    positivePromptBase: "",
    negativePrompt: "",
    sizePreset: "1328*1328",
    promptExtend: true,
    promptHint: "Describe the product scene, style, and composition\u2026",
  },
];

export function getPresetById(id: string): UseCasePreset | undefined {
  return USE_CASE_PRESETS.find((preset) => preset.id === id);
}
