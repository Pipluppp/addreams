import { useAtom } from "jotai";
import { useState } from "react";
import { SectionShell } from "../../components/atoms/SectionShell";
import { AdGraphicsPanel } from "../../components/organisms/AdGraphicsPanel";
import { EditedImageResultFrame } from "../../components/organisms/EditedImageResultFrame";
import { validateReferenceImageFile } from "../../lib/image-validation";
import { focusFirstError } from "../../lib/focus-first-error";
import { useAdGraphicsMutation } from "../../features/ad-graphics/use-ad-graphics-mutation";
import {
  adGraphicsFormAtom,
  adGraphicsLastSuccessAtom,
  defaultAdGraphicsValues,
} from "../../features/ad-graphics/state";
import {
  validateAdGraphicsForm,
  type AdGraphicsField,
  type AdGraphicsValidationErrors,
} from "../../features/ad-graphics/schema";

const AD_GRAPHICS_FIELD_IDS: Record<AdGraphicsField, string> = {
  referenceImage: "reference-upload-button",
  referenceImageUrl: "reference-image-url",
  prompt: "edit-instruction",
  negative_prompt: "ad-graphics-negative-prompt",
  seed: "ad-seed",
  customSize: "custom-size-width",
};

export default function AdGraphicsRoute() {
  const [formValues, setFormValues] = useAtom(adGraphicsFormAtom);
  const [lastSuccess, setLastSuccess] = useAtom(adGraphicsLastSuccessAtom);
  const [errors, setErrors] = useState<AdGraphicsValidationErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const mutation = useAdGraphicsMutation();

  function handleSubmit() {
    const validation = validateAdGraphicsForm(formValues);
    if (!validation.isValid) {
      setErrors(validation.errors);
      focusFirstError(validation.errors, AD_GRAPHICS_FIELD_IDS);
      return;
    }

    setErrors({});
    setSubmitError(null);

    mutation.mutate(formValues, {
      onSuccess: (result) => {
        setLastSuccess(result);
      },
      onError: (error) => {
        setSubmitError(error instanceof Error ? error.message : "Request failed.");
      },
    });
  }

  function handleFileSelected(file: File) {
    const validation = validateReferenceImageFile(file);
    if (!validation.valid) {
      setErrors((current) => ({
        ...current,
        referenceImage: validation.error,
      }));
      return;
    }

    setErrors((current) => {
      const { referenceImage: _referenceImage, ...rest } = current;
      return rest;
    });

    setFormValues((current) => ({
      ...current,
      referenceImageFile: file,
      referenceMode: "upload",
    }));
  }

  function handleClearForm() {
    setFormValues(defaultAdGraphicsValues);
    setErrors({});
    setSubmitError(null);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_0.95fr]">
      <SectionShell
        eyebrow="Workflow"
        heading="Ad Graphics"
        description="Edit existing images with instruction-driven prompts and Qwen-image-edit-ready parameters."
      >
        <AdGraphicsPanel
          values={formValues}
          errors={errors}
          isPending={mutation.isPending}
          onChange={setFormValues}
          onSubmit={handleSubmit}
          onClearForm={handleClearForm}
          onFileSelected={handleFileSelected}
        />
      </SectionShell>

      <SectionShell
        eyebrow="Results"
        heading="Edited Output"
        description="Stub metadata and request snapshot for validation before live model hookup."
      >
        <EditedImageResultFrame
          isPending={mutation.isPending}
          submitError={submitError}
          successRecord={lastSuccess}
        />
      </SectionShell>
    </div>
  );
}
