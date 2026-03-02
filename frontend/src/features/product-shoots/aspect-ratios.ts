import type { ProductShootsFormValues } from "./schema";

export type ProductShootsAspectRatioId = "story" | "square" | "feed";

export type ProductShootsAspectRatioOption = {
  id: ProductShootsAspectRatioId;
  label: string;
  size: ProductShootsFormValues["size"];
};

export const PRODUCT_SHOOTS_ASPECT_RATIOS: ProductShootsAspectRatioOption[] = [
  { id: "story", label: "Story (9:16)", size: "928*1664" },
  { id: "square", label: "Square (1:1)", size: "1328*1328" },
  { id: "feed", label: "Feed (4:5)", size: "1140*1472" },
];

export function getAspectRatioOption(
  aspectRatioId: ProductShootsAspectRatioId,
): ProductShootsAspectRatioOption {
  return (
    PRODUCT_SHOOTS_ASPECT_RATIOS.find((option) => option.id === aspectRatioId) ??
    PRODUCT_SHOOTS_ASPECT_RATIOS[0]!
  );
}

export function findAspectRatioIdBySize(
  size: ProductShootsFormValues["size"],
): ProductShootsAspectRatioId {
  return (
    PRODUCT_SHOOTS_ASPECT_RATIOS.find((option) => option.size === size)?.id ??
    "square"
  );
}
