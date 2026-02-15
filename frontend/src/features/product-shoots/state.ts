import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import type { ProductShootsRequest, WorkflowResponse } from "../../lib/api";
import type { ProductShootsFormValues } from "./schema";

export const defaultProductShootsValues: ProductShootsFormValues = {
  prompt: "",
  negative_prompt: "",
  size: "1328*1328",
  watermark: false,
  output_format: "png",
};

export const productShootsFormAtom = atomWithStorage<ProductShootsFormValues>(
  "addreams:product-shoots:draft:v3",
  defaultProductShootsValues,
);

export const productShootsStepAtom = atomWithStorage<number>("addreams:product-shoots:step:v3", 0);

export type ProductShootsSuccessRecord = {
  payload: ProductShootsRequest;
  response: WorkflowResponse;
};

export const productShootsLastSuccessAtom = atom<ProductShootsSuccessRecord | null>(null);
