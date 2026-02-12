import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
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

type AdGraphicsPersistedValues = Omit<AdGraphicsFormValues, "referenceImageFile">;
type SetStateAction<T> = T | ((prev: T) => T);

const defaultAdGraphicsPersistedValues: AdGraphicsPersistedValues = {
  referenceMode: defaultAdGraphicsValues.referenceMode,
  referenceImageUrl: defaultAdGraphicsValues.referenceImageUrl,
  prompt: defaultAdGraphicsValues.prompt,
  negative_prompt: defaultAdGraphicsValues.negative_prompt,
  sizeMode: defaultAdGraphicsValues.sizeMode,
  sizePreset: defaultAdGraphicsValues.sizePreset,
  customWidth: defaultAdGraphicsValues.customWidth,
  customHeight: defaultAdGraphicsValues.customHeight,
  seed: defaultAdGraphicsValues.seed,
  prompt_extend: defaultAdGraphicsValues.prompt_extend,
  watermark: defaultAdGraphicsValues.watermark,
};

const adGraphicsPersistedAtom = atomWithStorage<AdGraphicsPersistedValues>(
  "addreams:ad-graphics:draft:v2",
  defaultAdGraphicsPersistedValues,
);

const adGraphicsReferenceImageFileAtom = atom<File | null>(null);

export const adGraphicsFormAtom = atom(
  (get): AdGraphicsFormValues => ({
    ...get(adGraphicsPersistedAtom),
    referenceImageFile: get(adGraphicsReferenceImageFileAtom),
  }),
  (get, set, update: SetStateAction<AdGraphicsFormValues>) => {
    const previousValue: AdGraphicsFormValues = {
      ...get(adGraphicsPersistedAtom),
      referenceImageFile: get(adGraphicsReferenceImageFileAtom),
    };

    const nextValue = typeof update === "function" ? update(previousValue) : update;

    const { referenceImageFile, ...persisted } = nextValue;
    set(adGraphicsPersistedAtom, persisted);
    set(adGraphicsReferenceImageFileAtom, referenceImageFile);
  },
);

export const adGraphicsStepAtom = atomWithStorage<number>("addreams:ad-graphics:step:v2", 0);

export type AdGraphicsSuccessRecord = {
  payload: AdGraphicsRequest;
  response: WorkflowStubResponse;
};

export const adGraphicsLastSuccessAtom = atom<AdGraphicsSuccessRecord | null>(null);
