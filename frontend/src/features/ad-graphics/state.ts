import { atom } from "jotai";
import type { AdGraphicsRequest, WorkflowStubResponse } from "../../lib/api";
import type { AdGraphicsFormValues } from "./schema";

export const defaultAdGraphicsValues: AdGraphicsFormValues = {
  referenceMode: "upload",
  referenceImageUrl: "",
  referenceImageFile: null,
  prompt: "",
  negative_prompt: "",
  sizeMode: "preset",
  sizePreset: "1328*1328",
  customWidth: "",
  customHeight: "",
  seed: "",
  prompt_extend: true,
  watermark: false,
};

export const adGraphicsFormAtom = atom<AdGraphicsFormValues>(defaultAdGraphicsValues);

export type AdGraphicsSuccessRecord = {
  payload: AdGraphicsRequest;
  response: WorkflowStubResponse;
};

export const adGraphicsLastSuccessAtom = atom<AdGraphicsSuccessRecord | null>(null);
