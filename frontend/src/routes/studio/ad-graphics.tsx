import { useAtom } from "jotai";
import { useEffect, useState } from "react";
import { Button, Card } from "@heroui/react";
import { TextField } from "../../components/atoms/TextField";
import { ToggleField } from "../../components/atoms/ToggleField";
import { EditInstructionTextarea } from "../../components/molecules/EditInstructionTextarea";
import { ImageDropzone } from "../../components/molecules/ImageDropzone";
import { ImagePreviewCard } from "../../components/molecules/ImagePreviewCard";
import { NegativePromptTextarea } from "../../components/molecules/NegativePromptTextarea";
import { PromptExtendToggle } from "../../components/molecules/PromptExtendToggle";
import { ReferenceImageInputTabs } from "../../components/molecules/ReferenceImageInputTabs";
import { ResultMetadataChips } from "../../components/molecules/ResultMetadataChips";
import { SizePresetSelect } from "../../components/molecules/SizePresetSelect";
import { ResultPanel } from "../../components/organisms/ResultPanel";
import { StudioStepperLayout } from "../../components/organisms/StudioStepperLayout";
import {
  adGraphicsFormAtom,
  adGraphicsLastSuccessAtom,
  adGraphicsStepAtom,
  defaultAdGraphicsValues,
} from "../../features/ad-graphics/state";
import { useAdGraphicsMutation } from "../../features/ad-graphics/use-ad-graphics-mutation";
import {
  validateAdGraphicsForm,
  type AdGraphicsField,
  type AdGraphicsValidationErrors,
} from "../../features/ad-graphics/schema";
import { focusFirstError } from "../../lib/focus-first-error";
import { validateReferenceImageFile } from "../../lib/image-validation";
import { getWorkflowOutputImages, isWorkflowCompletedResponse } from "../../lib/api";
import { canNavigateToStep, deriveStepStatuses } from "../../lib/stepper";

const AD_STEPS = [
  { id: "brief", label: "Creative Brief" },
  { id: "inputs", label: "Inputs" },
  { id: "controls", label: "Creative Controls" },
  { id: "result", label: "Result & Iterate" },
] as const;

const AD_FIELD_IDS: Record<AdGraphicsField, string> = {
  referenceImage: "reference-upload-button",
  referenceImageUrl: "reference-image-url",
  prompt: "edit-instruction",
  negative_prompt: "ad-graphics-negative-prompt",
  seed: "ad-seed",
  customSize: "custom-size-width",
};

function validateAdStep(step: number, errors: AdGraphicsValidationErrors, hasSuccess: boolean) {
  if (step === 0) {
    return !errors.prompt;
  }
  if (step === 1) {
    return !errors.referenceImage && !errors.referenceImageUrl;
  }
  if (step === 2) {
    return !errors.negative_prompt && !errors.customSize;
  }
  return hasSuccess;
}

export default function AdGraphicsRoute() {
  const [formValues, setFormValues] = useAtom(adGraphicsFormAtom);
  const [currentStep, setCurrentStep] = useAtom(adGraphicsStepAtom);
  const [lastSuccess, setLastSuccess] = useAtom(adGraphicsLastSuccessAtom);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [errors, setErrors] = useState<AdGraphicsValidationErrors>({});
  const [uploadPreviewUrl, setUploadPreviewUrl] = useState<string | null>(null);
  const mutation = useAdGraphicsMutation();

  useEffect(() => {
    if (formValues.referenceMode !== "upload" || !formValues.referenceImageFile) {
      setUploadPreviewUrl(null);
      return;
    }

    const nextUrl = URL.createObjectURL(formValues.referenceImageFile);
    setUploadPreviewUrl(nextUrl);
    return () => URL.revokeObjectURL(nextUrl);
  }, [formValues.referenceMode, formValues.referenceImageFile]);

  const boundedStep = Math.max(0, Math.min(AD_STEPS.length - 1, currentStep));
  useEffect(() => {
    if (boundedStep !== currentStep) {
      setCurrentStep(boundedStep);
    }
  }, [boundedStep, currentStep, setCurrentStep]);

  const validation = validateAdGraphicsForm(formValues);
  const stepValidity = AD_STEPS.map((_, index) =>
    validateAdStep(index, validation.errors, Boolean(lastSuccess)),
  );
  const stepStatuses = deriveStepStatuses(boundedStep, stepValidity);

  const previewUrl =
    formValues.referenceMode === "url"
      ? formValues.referenceImageUrl.trim() || null
      : uploadPreviewUrl;

  function focusStepError(step: number, stepErrors: AdGraphicsValidationErrors) {
    const stepFieldOrder: Record<number, AdGraphicsField[]> = {
      0: ["prompt"],
      1: ["referenceImage", "referenceImageUrl"],
      2: ["negative_prompt", "customSize"],
      3: [],
    };

    for (const field of stepFieldOrder[step] ?? []) {
      if (stepErrors[field]) {
        focusFirstError(stepErrors, AD_FIELD_IDS);
        return;
      }
    }
  }

  function handleContinue() {
    if (!validateAdStep(boundedStep, validation.errors, Boolean(lastSuccess))) {
      setErrors(validation.errors);
      focusStepError(boundedStep, validation.errors);
      return;
    }

    setSubmitError(null);
    setCurrentStep((step) => Math.min(step + 1, AD_STEPS.length - 1));
  }

  function handleGenerate() {
    if (!validation.isValid) {
      setErrors(validation.errors);
      focusFirstError(validation.errors, AD_FIELD_IDS);
      return;
    }

    setErrors({});
    setSubmitError(null);

    mutation.mutate(formValues, {
      onSuccess: (result) => {
        setLastSuccess(result);
        setCurrentStep(3);
      },
      onError: (error) => {
        setSubmitError(error instanceof Error ? error.message : "Request failed.");
      },
    });
  }

  function handleFileSelected(file: File) {
    const result = validateReferenceImageFile(file);
    if (!result.valid) {
      setErrors((current) => ({ ...current, referenceImage: result.error }));
      return;
    }

    setErrors((current) => {
      const { referenceImage: _referenceImage, ...rest } = current;
      return rest;
    });

    setFormValues((current) => ({
      ...current,
      referenceMode: "upload",
      referenceImageFile: file,
    }));
  }

  function renderStepContent() {
    const generatedImages = lastSuccess ? getWorkflowOutputImages(lastSuccess.response) : [];
    const isCompleted = lastSuccess ? isWorkflowCompletedResponse(lastSuccess.response) : false;

    if (boundedStep === 0) {
      return (
        <Card className="space-y-4 bg-surface-alt p-5 sm:p-6">
          <div className="space-y-3 rounded-xl bg-canvas p-5">
            <EditInstructionTextarea
              id="edit-instruction"
              label="Shoot Direction"
              value={formValues.prompt}
              onChange={(next) => setFormValues({ ...formValues, prompt: next })}
              error={errors.prompt}
            />
            <p className="text-xs text-ink-muted">
              Tip: use positional language, such as "replace top-right badge with matte gold seal."
            </p>
          </div>
        </Card>
      );
    }

    if (boundedStep === 1) {
      return (
        <Card className="space-y-4 bg-surface-alt p-5 sm:p-6">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-3 rounded-xl bg-canvas p-5">
              <p className="accent-type text-[10px] uppercase tracking-[0.16em] text-ink-muted">
                Source Type
              </p>
              <p className="text-xs text-ink-soft">Choose how the product image enters the workflow.</p>
              <ReferenceImageInputTabs
                value={formValues.referenceMode}
                onChange={(mode) =>
                  setFormValues((current) => ({
                    ...current,
                    referenceMode: mode,
                    referenceImageFile: mode === "upload" ? current.referenceImageFile : null,
                    referenceImageUrl: mode === "url" ? current.referenceImageUrl : "",
                  }))
                }
              />
            </div>

            <div className="space-y-3 rounded-xl bg-canvas p-5">
              <p className="accent-type text-[10px] uppercase tracking-[0.16em] text-ink-muted">
                Product Reference
              </p>
              <p className="text-xs text-ink-soft">
                Provide the source image used for targeted product edits.
              </p>
              {formValues.referenceMode === "url" ? (
                <TextField
                  id="reference-image-url"
                  label="Reference image URL"
                  value={formValues.referenceImageUrl}
                  onChange={(event) =>
                    setFormValues((current) => ({
                      ...current,
                      referenceImageUrl: event.target.value,
                    }))
                  }
                  placeholder="https://example.com/reference-image.png"
                  error={errors.referenceImageUrl}
                />
              ) : (
                <ImageDropzone
                  onFileSelected={handleFileSelected}
                  error={errors.referenceImage}
                  buttonId="reference-upload-button"
                />
              )}
            </div>
          </div>
          {previewUrl ? (
            <div className="space-y-3 rounded-xl bg-canvas p-5">
              <p className="accent-type text-[10px] uppercase tracking-[0.16em] text-ink-muted">
                Preview
              </p>
              <ImagePreviewCard
                src={previewUrl}
                alt="Reference preview"
                onSwap={() => {
                  if (formValues.referenceMode === "upload") {
                    setFormValues((current) => ({ ...current, referenceImageFile: null }));
                  }
                }}
                onClear={() => {
                  setFormValues((current) => ({
                    ...current,
                    referenceImageFile: null,
                    referenceImageUrl: "",
                  }));
                }}
              />
            </div>
          ) : null}
        </Card>
      );
    }

    if (boundedStep === 2) {
      return (
        <Card className="space-y-4 bg-surface-alt p-5 sm:p-6">
          <div className="space-y-3 rounded-xl bg-canvas p-5">
            <p className="accent-type text-[10px] uppercase tracking-[0.16em] text-ink-muted">
              Exclusions
            </p>
            <NegativePromptTextarea
              id="ad-graphics-negative-prompt"
              value={formValues.negative_prompt}
              onChange={(next) => setFormValues({ ...formValues, negative_prompt: next })}
              error={errors.negative_prompt}
            />
          </div>

          <div className="space-y-3 rounded-xl bg-canvas p-5">
            <p className="accent-type text-[10px] uppercase tracking-[0.16em] text-ink-muted">
              Output Size
            </p>
            <ToggleField
              id="ad-custom-size-toggle"
              label="Custom size mode"
              helperText="Enable manual width and height bounds."
              checked={formValues.sizeMode === "custom"}
              onChange={(isSelected) =>
                setFormValues({
                  ...formValues,
                  sizeMode: isSelected ? "custom" : "preset",
                })
              }
            />

            {formValues.sizeMode === "preset" ? (
              <SizePresetSelect
                id="ad-size-preset"
                value={formValues.sizePreset}
                onChange={(next) =>
                  setFormValues({
                    ...formValues,
                    sizePreset: next as typeof formValues.sizePreset,
                  })
                }
              />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                <TextField
                  id="custom-size-width"
                  label="Custom width"
                  value={formValues.customWidth}
                  onChange={(event) =>
                    setFormValues({ ...formValues, customWidth: event.target.value })
                  }
                  type="number"
                  inputMode="numeric"
                  placeholder="1024"
                  error={errors.customSize}
                />
                <TextField
                  id="custom-size-height"
                  label="Custom height"
                  value={formValues.customHeight}
                  onChange={(event) =>
                    setFormValues({ ...formValues, customHeight: event.target.value })
                  }
                  type="number"
                  inputMode="numeric"
                  placeholder="1024"
                  error={errors.customSize}
                />
              </div>
            )}
          </div>

          <div className="space-y-3 rounded-xl bg-canvas p-5">
            <p className="accent-type text-[10px] uppercase tracking-[0.16em] text-ink-muted">
              Generation Option
            </p>
            <PromptExtendToggle
              id="ad-prompt-extend"
              checked={formValues.prompt_extend}
              onChange={(next) => setFormValues({ ...formValues, prompt_extend: next })}
            />
          </div>
        </Card>
      );
    }

    return (
      <ResultPanel
        isPending={mutation.isPending}
        error={submitError}
        isEmpty={!lastSuccess}
        emptyLabel="No product shoot results yet. Complete controls and run generate."
        loadingLabel="Generating ad graphic…"
        onIterate={() => setCurrentStep(2)}
        iterateLabel="Back to Controls"
        successContent={
          <Card className="space-y-4 p-4 sm:p-5">
            <p className="text-sm text-ink-soft">
              {isCompleted
                ? "Generation completed. Edited output image variants are shown below."
                : "Request accepted by workflow. Edited image previews appear when generated output is returned."}
            </p>
            {lastSuccess ? <ResultMetadataChips response={lastSuccess.response} /> : null}
            {generatedImages.length ? (
              <div className="space-y-3">
                <p className="accent-type text-[10px] uppercase tracking-[0.16em] text-ink-muted">
                  Generated Images
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {generatedImages.map((image, index) => (
                    <div key={`${image.url}-${index}`} className="space-y-2">
                      <img
                        src={image.url}
                        alt={`Edited output ${index + 1}`}
                        width={1400}
                        height={1400}
                        loading="lazy"
                        decoding="async"
                        className="h-auto max-h-72 w-full rounded-xl bg-surface-alt object-contain"
                      />
                      <a
                        href={image.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex text-xs font-medium text-ink hover:text-ink-soft"
                      >
                        Open image {index + 1}
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            {lastSuccess ? (
              <pre className="max-h-72 overflow-auto bg-surface-alt p-3 text-xs text-ink-soft">
                {JSON.stringify(
                  {
                    referenceImageSource:
                      lastSuccess.payload.referenceImageUrl.slice(0, 80) +
                      (lastSuccess.payload.referenceImageUrl.length > 80 ? "…" : ""),
                    parameters: lastSuccess.payload.parameters,
                  },
                  null,
                  2,
                )}
              </pre>
            ) : null}
            <Button
              type="button"
              variant="ghost"
              onPress={() => {
                if (!window.confirm("Discard this ad graphic draft?")) {
                  return;
                }
                setFormValues(defaultAdGraphicsValues);
                setErrors({});
                setSubmitError(null);
                setCurrentStep(0);
              }}
            >
              Reset Draft
            </Button>
          </Card>
        }
      />
    );
  }

  return (
    <div className="container-shell py-6 sm:py-8">
      <StudioStepperLayout
        workflow="Product Shoots"
        title="Reference-Based Product Shoot Workflow"
        description="Upload or link source images, tune controls, and generate refined product shoot variants."
        steps={AD_STEPS}
        statuses={stepStatuses}
        currentStep={boundedStep}
        onStepSelect={(index) => setCurrentStep(index)}
        canSelectStep={(index) => {
          if (index === 3 && !lastSuccess) {
            return false;
          }
          return canNavigateToStep(index, boundedStep, stepValidity);
        }}
        onBack={() => setCurrentStep((step) => Math.max(step - 1, 0))}
        canBack={boundedStep > 0}
        onPrimaryAction={() => {
          if (boundedStep < 2) {
            handleContinue();
            return;
          }
          if (boundedStep === 2) {
            handleGenerate();
            return;
          }
          setCurrentStep(2);
        }}
        primaryActionLabel={
          boundedStep < 2 ? "Continue" : boundedStep === 2 ? "Generate" : "Back to Controls"
        }
        primaryActionPendingLabel="Generating…"
        primaryActionTone={boundedStep === 2 ? "primary" : "secondary"}
        isPrimaryPending={mutation.isPending}
      >
        {renderStepContent()}
      </StudioStepperLayout>
    </div>
  );
}
