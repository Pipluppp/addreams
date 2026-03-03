export const PRODUCT_SHOOTS_TEMPLATE_CAP = 4;

export type ProductShootsTemplateCategory =
  | "Beauty (Recommended)"
  | "General"
  | "Fashion";

export type ProductShootsTemplate = {
  id: string;
  label: string;
  category: ProductShootsTemplateCategory;
  summary: string;
  promptSeed: string;
  preview: {
    toneLabel: string;
    gradientFrom: string;
    gradientTo: string;
  };
};

export const PRODUCT_SHOOTS_TEMPLATES: ProductShootsTemplate[] = [
  {
    id: "beauty-clean-minimal",
    label: "Clean Minimal",
    category: "Beauty (Recommended)",
    summary: "Soft studio light, premium shelf styling.",
    promptSeed: "clean minimal hero shot with soft studio light and premium shelf styling",
    preview: {
      toneLabel: "Studio",
      gradientFrom: "#FFF8E7",
      gradientTo: "#E8F2FF",
    },
  },
  {
    id: "beauty-dewy-glow",
    label: "Dewy Glow",
    category: "Beauty (Recommended)",
    summary: "Hydration-focused glow with fresh highlights.",
    promptSeed: "dewy luminous campaign look with fresh highlights and soft reflections",
    preview: {
      toneLabel: "Glow",
      gradientFrom: "#FFE8D9",
      gradientTo: "#FFF3BF",
    },
  },
  {
    id: "beauty-botanical",
    label: "Botanical",
    category: "Beauty (Recommended)",
    summary: "Natural leaves and ingredients in frame.",
    promptSeed: "botanical scene with natural leaves and clean styling",
    preview: {
      toneLabel: "Nature",
      gradientFrom: "#E2F7E5",
      gradientTo: "#F9F5F0",
    },
  },
  {
    id: "general-catalog",
    label: "Catalog",
    category: "General",
    summary: "Neutral background and ecommerce framing.",
    promptSeed: "ecommerce catalog framing with balanced composition and neutral background",
    preview: {
      toneLabel: "Catalog",
      gradientFrom: "#F3F4F6",
      gradientTo: "#E5E7EB",
    },
  },
  {
    id: "general-lifestyle",
    label: "Lifestyle",
    category: "General",
    summary: "Context-rich setting with subtle props.",
    promptSeed: "lifestyle photography with tasteful props and contextual setting",
    preview: {
      toneLabel: "Context",
      gradientFrom: "#FFF1EB",
      gradientTo: "#E8F7FF",
    },
  },
  {
    id: "general-motion",
    label: "Motion Splash",
    category: "General",
    summary: "Dynamic droplets and movement cues.",
    promptSeed: "dynamic product photo with splash motion elements",
    preview: {
      toneLabel: "Dynamic",
      gradientFrom: "#DFF3FF",
      gradientTo: "#E6ECFF",
    },
  },
  {
    id: "general-monochrome",
    label: "Monochrome",
    category: "General",
    summary: "Single-tone palette with dramatic contrast.",
    promptSeed: "monochrome product composition with dramatic contrast",
    preview: {
      toneLabel: "Mono",
      gradientFrom: "#F3F4F6",
      gradientTo: "#D1D5DB",
    },
  },
  {
    id: "fashion-editorial",
    label: "Editorial",
    category: "Fashion",
    summary: "Magazine-style framing and texture.",
    promptSeed: "fashion editorial framing with modern composition and magazine-style lighting",
    preview: {
      toneLabel: "Editorial",
      gradientFrom: "#FFE4E6",
      gradientTo: "#E0E7FF",
    },
  },
  {
    id: "fashion-street",
    label: "Street",
    category: "Fashion",
    summary: "Urban texture and directional lighting.",
    promptSeed: "street style presentation with urban textures and directional lighting",
    preview: {
      toneLabel: "Urban",
      gradientFrom: "#E2E8F0",
      gradientTo: "#CBD5E1",
    },
  },
  {
    id: "fashion-luxury",
    label: "Luxury",
    category: "Fashion",
    summary: "Refined finish with polished accents.",
    promptSeed: "luxury scene with polished surfaces and refined highlights",
    preview: {
      toneLabel: "Luxury",
      gradientFrom: "#FFF7D6",
      gradientTo: "#FDE68A",
    },
  },
];

export function getTemplateById(templateId: string) {
  return PRODUCT_SHOOTS_TEMPLATES.find((template) => template.id === templateId) ?? null;
}

export function groupTemplatesByCategory(templates: ProductShootsTemplate[]) {
  const grouped = new Map<ProductShootsTemplateCategory, ProductShootsTemplate[]>();

  for (const template of templates) {
    const current = grouped.get(template.category);
    if (current) {
      current.push(template);
      continue;
    }

    grouped.set(template.category, [template]);
  }

  return Array.from(grouped.entries()).map(([category, items]) => ({ category, items }));
}

export function toggleTemplateSelection(
  currentSelection: string[],
  templateId: string,
  maxSelection = PRODUCT_SHOOTS_TEMPLATE_CAP,
): string[] {
  if (currentSelection.includes(templateId)) {
    return currentSelection.filter((id) => id !== templateId);
  }

  if (currentSelection.length >= maxSelection) {
    return currentSelection;
  }

  return [...currentSelection, templateId];
}

export function isTemplateSelectionAtCap(
  currentSelection: string[],
  maxSelection = PRODUCT_SHOOTS_TEMPLATE_CAP,
): boolean {
  return currentSelection.length >= maxSelection;
}

export function composeGuidedPrompt(
  prompt: string,
  selectedTemplateIds: string[],
  referenceHint?: string,
): string {
  const trimmedPrompt = prompt.trim();
  const selectedSeeds = selectedTemplateIds
    .map((templateId) => getTemplateById(templateId)?.promptSeed)
    .filter((seed): seed is string => Boolean(seed));

  const chunks = [
    "Generate a polished product shoot image for an ecommerce campaign.",
    selectedSeeds.length ? `Template directions: ${selectedSeeds.join("; ")}.` : "",
    trimmedPrompt ? `Creative direction: ${trimmedPrompt}.` : "",
    referenceHint ? `Reference context: ${referenceHint}.` : "",
  ].filter(Boolean);

  return chunks.join(" ");
}

export function composeTemplateShotPrompt(template: ProductShootsTemplate): string {
  return [
    "Use the provided reference image as the exact product to feature.",
    "Preserve product identity, geometry, color, and material cues from the reference.",
    `Style direction: ${template.promptSeed}.`,
    "Produce one polished commercial product photo.",
  ].join(" ");
}
