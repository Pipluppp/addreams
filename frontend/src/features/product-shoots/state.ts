import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import type { ProductShootsRequest, WorkflowResponse } from "../../lib/api";
import type { ProductShootsFormValues } from "./schema";
import type {
  ProductShootsAspectRatioId,
  ProductShootsAspectRatioOption,
} from "./aspect-ratios";
import {
  findAspectRatioIdBySize,
  getAspectRatioOption,
  PRODUCT_SHOOTS_ASPECT_RATIOS,
} from "./aspect-ratios";
import type { ProductShootsStudioState } from "./studio-machine";
import type { ProductShootsGuidedComposeStep } from "./studio-machine";

export const defaultProductShootsValues: ProductShootsFormValues = {
  prompt: "",
  negative_prompt: "",
  size: "1328*1328",
  watermark: false,
  output_format: "png",
};

export const productShootsFormAtom = atomWithStorage<ProductShootsFormValues>(
  "addreams:product-shoots:draft:v4",
  defaultProductShootsValues,
);

export type ProductShootsReferenceMode = "upload" | "url";

export type ProductShootsReferenceDraft = {
  mode: ProductShootsReferenceMode;
  imageUrl: string;
  imageFile: File | null;
};

type ProductShootsReferencePersisted = Omit<ProductShootsReferenceDraft, "imageFile">;
type SetStateAction<T> = T | ((previous: T) => T);

const defaultReferencePersisted: ProductShootsReferencePersisted = {
  mode: "upload",
  imageUrl: "",
};

const productShootsReferencePersistedAtom = atomWithStorage<ProductShootsReferencePersisted>(
  "addreams:product-shoots:reference:v1",
  defaultReferencePersisted,
);

const productShootsReferenceFileAtom = atom<File | null>(null);

export const productShootsReferenceAtom = atom(
  (get): ProductShootsReferenceDraft => ({
    ...get(productShootsReferencePersistedAtom),
    imageFile: get(productShootsReferenceFileAtom),
  }),
  (get, set, update: SetStateAction<ProductShootsReferenceDraft>) => {
    const previousValue = {
      ...get(productShootsReferencePersistedAtom),
      imageFile: get(productShootsReferenceFileAtom),
    };

    const nextValue = typeof update === "function" ? update(previousValue) : update;
    const { imageFile, ...persisted } = nextValue;

    set(productShootsReferencePersistedAtom, persisted);
    set(productShootsReferenceFileAtom, imageFile);
  },
);

export type ProductShootsOutputItem = {
  id: string;
  url: string;
  source: "guided" | "edit";
  label: string;
};

export type ProductShootsSuccessRecord = {
  payload: ProductShootsRequest;
  response: WorkflowResponse;
};

export const productShootsStudioStateAtom = atomWithStorage<ProductShootsStudioState>(
  "addreams:product-shoots:state:v1",
  "entry",
);

export const productShootsGuidedComposeStepAtom = atomWithStorage<ProductShootsGuidedComposeStep>(
  "addreams:product-shoots:guided-step:v1",
  "product",
);

export const productShootsTemplateSelectionAtom = atomWithStorage<string[]>(
  "addreams:product-shoots:templates:v1",
  [],
);

export const productShootsSelectedOutputIdAtom = atom<string | null>(null);

export const productShootsEditorPromptAtom = atomWithStorage<string>(
  "addreams:product-shoots:editor-prompt:v1",
  "",
);

export const productShootsOutputsAtom = atom<ProductShootsOutputItem[]>([]);

export const productShootsLastSuccessAtom = atom<ProductShootsSuccessRecord | null>(null);

export const productShootsAspectRatioAtom = atomWithStorage<ProductShootsAspectRatioId>(
  "addreams:product-shoots:aspect:v1",
  "story",
);

export const productShootsAspectRatioOptionAtom = atom<ProductShootsAspectRatioOption>((get) => {
  const aspectRatioId = get(productShootsAspectRatioAtom);
  return getAspectRatioOption(aspectRatioId);
});

export const productShootsAspectRatioOptionsAtom = atom(() => PRODUCT_SHOOTS_ASPECT_RATIOS);

export const syncProductShootsSizeFromAspectAtom = atom(null, (get, set) => {
  const option = get(productShootsAspectRatioOptionAtom);
  const form = get(productShootsFormAtom);
  if (form.size === option.size) {
    return;
  }

  set(productShootsFormAtom, {
    ...form,
    size: option.size,
  });
});

export const syncAspectFromProductShootsSizeAtom = atom(null, (get, set) => {
  const form = get(productShootsFormAtom);
  const nextAspect = findAspectRatioIdBySize(form.size);
  const currentAspect = get(productShootsAspectRatioAtom);
  if (nextAspect === currentAspect) {
    return;
  }

  set(productShootsAspectRatioAtom, nextAspect);
});
