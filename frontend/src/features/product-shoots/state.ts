import { atom } from "jotai";
import type { ProductShootsRequest, WorkflowStubResponse } from "../../lib/api";
import type { ProductShootsFormValues } from "./schema";

export const defaultProductShootsValues: ProductShootsFormValues = {
  prompt: "",
  negative_prompt: "",
  size: "1328*1328",
  seed: "",
  prompt_extend: true,
  watermark: false,
  output_format: "png",
};

export const productShootsFormAtom = atom<ProductShootsFormValues>(defaultProductShootsValues);

export type ProductShootsSuccessRecord = {
  payload: ProductShootsRequest;
  response: WorkflowStubResponse;
};

export const productShootsLastSuccessAtom = atom<ProductShootsSuccessRecord | null>(null);
