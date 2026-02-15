export type PromptTemplate = {
  id: string;
  label: string;
  text: string;
  category: string;
};

export const PROMPT_TEMPLATES: PromptTemplate[] = [
  // Background
  {
    id: "bg-studio-white",
    label: "Studio white background",
    text: "Place the product on a clean studio white background with soft shadows",
    category: "Background",
  },
  {
    id: "bg-outdoor",
    label: "Outdoor natural setting",
    text: "Place the product in an outdoor natural setting with greenery and soft sunlight",
    category: "Background",
  },
  {
    id: "bg-marble",
    label: "Marble / stone surface",
    text: "Place the product on a polished marble surface with subtle reflections",
    category: "Background",
  },

  // Styling
  {
    id: "style-pastel",
    label: "Minimalist pastel",
    text: "Style with a minimalist pastel color palette and clean geometric shapes",
    category: "Styling",
  },
  {
    id: "style-holiday",
    label: "Holiday / seasonal theme",
    text: "Add festive seasonal decorations and warm holiday atmosphere around the product",
    category: "Styling",
  },
  {
    id: "style-luxury",
    label: "Luxury / premium feel",
    text: "Create a premium luxury setting with rich textures, dark tones, and elegant props",
    category: "Styling",
  },

  // Lighting
  {
    id: "light-dramatic",
    label: "Dramatic studio lighting",
    text: "Apply dramatic studio lighting with strong contrast and defined shadows",
    category: "Lighting",
  },
  {
    id: "light-natural",
    label: "Soft natural daylight",
    text: "Light the scene with soft natural daylight from a large window",
    category: "Lighting",
  },
  {
    id: "light-golden",
    label: "Golden hour warmth",
    text: "Bathe the scene in warm golden hour sunlight with long soft shadows",
    category: "Lighting",
  },

  // Composition
  {
    id: "comp-tabletop",
    label: "Lifestyle tabletop with props",
    text: "Arrange on a styled tabletop with complementary lifestyle props",
    category: "Composition",
  },
  {
    id: "comp-flatlay",
    label: "Flat lay overhead",
    text: "Shoot from directly above as a flat lay arrangement on a textured surface",
    category: "Composition",
  },
  {
    id: "comp-closeup",
    label: "Close-up detail shot",
    text: "Zoom in for a close-up detail shot highlighting texture and craftsmanship",
    category: "Composition",
  },
];

export function getTemplateCategories(): string[] {
  const seen = new Set<string>();
  const categories: string[] = [];
  for (const template of PROMPT_TEMPLATES) {
    if (!seen.has(template.category)) {
      seen.add(template.category);
      categories.push(template.category);
    }
  }
  return categories;
}

export function getTemplatesByCategory(category: string): PromptTemplate[] {
  return PROMPT_TEMPLATES.filter((t) => t.category === category);
}
