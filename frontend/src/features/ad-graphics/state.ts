import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import type { AdGraphicsRequest, WorkflowResponse } from "../../lib/api";
import { getPresetById } from "./presets";
import type { AdGraphicsFormValues } from "./schema";

const DEFAULT_PRESET_ID = "product-hero";
const defaultPreset = getPresetById(DEFAULT_PRESET_ID)!;

export const defaultAdGraphicsValues: AdGraphicsFormValues = {
  referenceMode: "upload",
  referenceImageUrl: "",
  referenceImageFile: null,
  prompt: defaultPreset.positivePromptBase,
  negative_prompt: defaultPreset.negativePrompt,
  sizeMode: "preset",
  sizePreset: defaultPreset.sizePreset,
  customWidth: "",
  customHeight: "",
  watermark: false,
  selectedPreset: DEFAULT_PRESET_ID,
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
  watermark: defaultAdGraphicsValues.watermark,
  selectedPreset: defaultAdGraphicsValues.selectedPreset,
};

const adGraphicsPersistedAtom = atomWithStorage<AdGraphicsPersistedValues>(
  "addreams:ad-graphics:draft:v5",
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

export const adGraphicsStepAtom = atomWithStorage<number>("addreams:ad-graphics:step:v5", 0);

export type AdGraphicsSuccessRecord = {
  payload: AdGraphicsRequest;
  response: WorkflowResponse;
};

export const adGraphicsLastSuccessAtom = atom<AdGraphicsSuccessRecord | null>(null);

export type TemplateSelectionsState = Record<string, string | null>;

export const adGraphicsTemplateSelectionsAtom = atomWithStorage<TemplateSelectionsState>(
  "addreams:ad-graphics:templates:v1",
  {},
);
