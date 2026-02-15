import { useAtom } from "jotai";
import { useEffect, useMemo, useState } from "react";
import { Button, Card, Disclosure } from "@heroui/react";
import { TextField } from "../../components/atoms/TextField";
import { ToggleField } from "../../components/atoms/ToggleField";
import { GuidanceCallout } from "../../components/atoms/GuidanceCallout";
import { EditInstructionTextarea } from "../../components/molecules/EditInstructionTextarea";
import { ImageDropzone } from "../../components/molecules/ImageDropzone";
import { ImagePreviewCard } from "../../components/molecules/ImagePreviewCard";
import { NegativePromptTextarea } from "../../components/molecules/NegativePromptTextarea";
import {
  PromptTemplatePicker,
  composePromptFromSelections,
} from "../../components/molecules/PromptTemplatePicker";
import { ReferenceImageInputTabs } from "../../components/molecules/ReferenceImageInputTabs";
import { ResultMetadataChips } from "../../components/molecules/ResultMetadataChips";
import { SizePresetSelect } from "../../components/molecules/SizePresetSelect";
import { UseCasePresetPicker } from "../../components/molecules/UseCasePresetPicker";
import { ResultPanel } from "../../components/organisms/ResultPanel";
import { StudioStepperLayout } from "../../components/organisms/StudioStepperLayout";
import {
  adGraphicsFormAtom,
  adGraphicsLastSuccessAtom,
  adGraphicsStepAtom,
  adGraphicsTemplateSelectionsAtom,
  defaultAdGraphicsValues,
} from "../../features/ad-graphics/state";
import { useAdGraphicsMutation } from "../../features/ad-graphics/use-ad-graphics-mutation";
import {
  validateAdGraphicsForm,
  type AdGraphicsField,
  type AdGraphicsValidationErrors,
} from "../../features/ad-graphics/schema";
import { USE_CASE_PRESETS, getPresetById } from "../../features/ad-graphics/presets";
import { PROMPT_TEMPLATES } from "../../features/ad-graphics/prompt-templates";
import { detectIntentWarnings } from "../../features/ad-graphics/intent-detection";
import { augmentNegativePrompt } from "../../features/ad-graphics/payload";
import { focusFirstError } from "../../lib/focus-first-error";
import {
  checkImageQuality,
  getImageDimensions,
  validateReferenceImageFile,
  type ImageDimensions,
} from "../../lib/image-validation";
import { getWorkflowOutputImages, isWorkflowCompletedResponse } from "../../lib/api";
import { canNavigateToStep, deriveStepStatuses } from "../../lib/stepper";

const AD_STEPS = [
  { id: "compose", label: "Your Product Shot" },
  { id: "result", label: "Result & Iterate" },
] as const;

const AD_FIELD_IDS: Record<AdGraphicsField, string> = {
  referenceImage: "reference-upload-button",
  referenceImageUrl: "reference-image-url",
  prompt: "edit-instruction",
  negative_prompt: "ad-graphics-negative-prompt",
  customSize: "custom-size-width",
};

function validateAdStep(step: number, errors: AdGraphicsValidationErrors, hasSuccess: boolean) {
  if (step === 0) {
    return (
      !errors.prompt &&
      !errors.referenceImage &&
      !errors.referenceImageUrl &&
      !errors.negative_prompt &&
      !errors.customSize
    );
  }
  return hasSuccess;
}

function useDebounced<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}

function buildAdvancedSummary(formValues: {
  sizeMode: string;
  sizePreset: string;
  customWidth: string;
  customHeight: string;
  negative_prompt: string;
}) {
  const size =
    formValues.sizeMode === "preset"
      ? formValues.sizePreset.replace("*", "\u00d7")
      : `${formValues.customWidth}\u00d7${formValues.customHeight}`;
  const parts = [size];
  if (formValues.negative_prompt.trim()) {
    parts.push("Negative prompt applied");
  }
  return parts.join(" \u00b7 ");
}

export default function AdGraphicsRoute() {
  const [formValues, setFormValues] = useAtom(adGraphicsFormAtom);
  const [currentStep, setCurrentStep] = useAtom(adGraphicsStepAtom);
  const [lastSuccess, setLastSuccess] = useAtom(adGraphicsLastSuccessAtom);
  const [templateSelections, setTemplateSelections] = useAtom(adGraphicsTemplateSelectionsAtom);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [errors, setErrors] = useState<AdGraphicsValidationErrors>({});
  const [uploadPreviewUrl, setUploadPreviewUrl] = useState<string | null>(null);
  const [imageDimensions, setImageDimensions] = useState<ImageDimensions | null>(null);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [templatesExpanded, setTemplatesExpanded] = useState(false);
  const mutation = useAdGraphicsMutation();

  useEffect(() => {
    if (formValues.referenceMode !== "upload" || !formValues.referenceImageFile) {
      setUploadPreviewUrl(null);
      setImageDimensions(null);
      return;
    }

    const nextUrl = URL.createObjectURL(formValues.referenceImageFile);
    setUploadPreviewUrl(nextUrl);

    getImageDimensions(formValues.referenceImageFile)
      .then(setImageDimensions)
      .catch(() => setImageDimensions(null));

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

  const activePreset = getPresetById(formValues.selectedPreset);
  const debouncedPrompt = useDebounced(formValues.prompt, 500);
  const intentWarnings = useMemo(
    () => detectIntentWarnings(debouncedPrompt),
    [debouncedPrompt],
  );

  const imageQuality = imageDimensions
    ? checkImageQuality(imageDimensions.width, imageDimensions.height)
    : null;

  const effectiveNegativePrompt = useMemo(
    () => augmentNegativePrompt(formValues.negative_prompt.trim(), formValues.prompt.trim()),
    [formValues.negative_prompt, formValues.prompt],
  );

  const hasAugmentation = effectiveNegativePrompt !== formValues.negative_prompt.trim();

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
        setCurrentStep(1);
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

  function handlePresetSelect(preset: {
    id: string;
    positivePromptBase: string;
    negativePrompt: string;
    sizePreset: string;
  }) {
    const composed = composePromptFromSelections(
      preset.positivePromptBase,
      templateSelections,
      PROMPT_TEMPLATES,
    );
    setFormValues((current) => ({
      ...current,
      selectedPreset: preset.id,
      prompt: composed,
      negative_prompt: preset.negativePrompt,
      sizePreset: preset.sizePreset as typeof current.sizePreset,
      sizeMode: "preset",
    }));
  }

  function handleTemplateSelectionsChange(next: Record<string, string | null>) {
    setTemplateSelections(next);
    const presetBase = activePreset?.positivePromptBase ?? "";
    const composed = composePromptFromSelections(presetBase, next, PROMPT_TEMPLATES);
    setFormValues((current) => ({ ...current, prompt: composed }));
  }

  function renderStepContent() {
    const generatedImages = lastSuccess ? getWorkflowOutputImages(lastSuccess.response) : [];
    const isCompleted = lastSuccess ? isWorkflowCompletedResponse(lastSuccess.response) : false;

    if (boundedStep === 0) {
      return (
        <Card className="space-y-5 bg-surface-alt p-5 sm:p-6">
          {/* Reference Image Section */}
          <div className="space-y-3 rounded-xl bg-canvas p-5">
            <p className="accent-type text-[10px] uppercase tracking-[0.16em] text-ink-muted">
              Product Reference
            </p>
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
            {previewUrl ? (
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
                  setImageDimensions(null);
                }}
              />
            ) : null}
            {imageQuality?.isLowRes ? (
              <GuidanceCallout tone="warning">{imageQuality.message}</GuidanceCallout>
            ) : null}
          </div>

          {/* Use-Case Preset Picker */}
          <div className="space-y-3 rounded-xl bg-canvas p-5">
            <p className="accent-type text-[10px] uppercase tracking-[0.16em] text-ink-muted">
              Use Case
            </p>
            <UseCasePresetPicker
              presets={USE_CASE_PRESETS}
              selectedPresetId={formValues.selectedPreset}
              onSelect={handlePresetSelect}
            />
          </div>

          {/* Prompt Section */}
          <div className="space-y-3 rounded-xl bg-canvas p-5">
            <EditInstructionTextarea
              id="edit-instruction"
              label="Shoot Direction"
              value={formValues.prompt}
              onChange={(next) => setFormValues({ ...formValues, prompt: next })}
              error={errors.prompt}
              placeholder={activePreset?.promptHint}
            />
            <PromptTemplatePicker
              templates={PROMPT_TEMPLATES}
              selections={templateSelections}
              onSelectionsChange={handleTemplateSelectionsChange}
              isExpanded={templatesExpanded}
              onExpandedChange={setTemplatesExpanded}
            />
            {intentWarnings.map((warning) => (
              <GuidanceCallout key={warning.id} tone="warning">
                {warning.message}
              </GuidanceCallout>
            ))}
            <GuidanceCallout tone="tip">
              Works best: changing backgrounds, lighting, adding props, styling scenes.
            </GuidanceCallout>
          </div>

          {/* Payload Preview */}
          {formValues.prompt.trim() ? (
            <div className="space-y-2 rounded-xl border border-ink-muted/10 bg-canvas p-4">
              <p className="accent-type text-[10px] uppercase tracking-[0.16em] text-ink-muted">
                What will be sent
              </p>
              <div className="space-y-1.5">
                <div>
                  <p className="text-[10px] font-medium text-ink-muted">Positive prompt</p>
                  <p className="text-xs text-ink">{formValues.prompt.trim()}</p>
                </div>
                {effectiveNegativePrompt ? (
                  <div>
                    <p className="text-[10px] font-medium text-ink-muted">
                      Negative prompt
                      {hasAugmentation ? (
                        <span className="ml-1 text-accent"> (auto-augmented)</span>
                      ) : null}
                    </p>
                    <p className="text-xs text-ink-soft">{effectiveNegativePrompt}</p>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

          {/* Advanced Options */}
          <div className="rounded-xl bg-canvas p-5">
            <Disclosure isExpanded={advancedOpen} onExpandedChange={setAdvancedOpen}>
              <Disclosure.Heading>
                <Disclosure.Trigger className="flex w-full cursor-pointer items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Disclosure.Indicator />
                    <span className="text-xs font-medium text-ink-soft">Advanced Options</span>
                  </div>
                  {!advancedOpen ? (
                    <span className="text-[10px] text-ink-muted">
                      {buildAdvancedSummary(formValues)}
                    </span>
                  ) : null}
                </Disclosure.Trigger>
              </Disclosure.Heading>
              <Disclosure.Content>
                <Disclosure.Body className="space-y-4 pt-4">
                  <NegativePromptTextarea
                    id="ad-graphics-negative-prompt"
                    value={formValues.negative_prompt}
                    onChange={(next) => setFormValues({ ...formValues, negative_prompt: next })}
                    error={errors.negative_prompt}
                  />

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

                </Disclosure.Body>
              </Disclosure.Content>
            </Disclosure>
          </div>
        </Card>
      );
    }

    return (
      <ResultPanel
        isPending={mutation.isPending}
        error={submitError}
        isEmpty={!lastSuccess}
        emptyLabel="No product shoot results yet. Complete the form and hit Generate."
        loadingLabel="Generating ad graphic\u2026"
        onIterate={() => setCurrentStep(0)}
        iterateLabel="Back to Edit"
        successContent={
          <Card className="space-y-5 p-4 sm:p-5">
            <p className="text-sm text-ink-soft">
              {isCompleted
                ? "Generation completed. Edited output image variants are shown below."
                : "Request accepted by workflow. Edited image previews appear when generated output is returned."}
            </p>
            {lastSuccess ? <ResultMetadataChips response={lastSuccess.response} /> : null}

            {/* Generated Images */}
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

            {/* Input summary: reference image + prompts used */}
            {lastSuccess ? (
              <div className="space-y-3 rounded-xl bg-surface-alt p-4">
                <p className="accent-type text-[10px] uppercase tracking-[0.16em] text-ink-muted">
                  Input Used
                </p>
                <div className="grid gap-4 sm:grid-cols-[auto_1fr]">
                  <img
                    src={lastSuccess.payload.referenceImageUrl}
                    alt="Reference input"
                    loading="lazy"
                    decoding="async"
                    className="h-auto w-full max-w-40 rounded-lg bg-canvas object-contain sm:w-40"
                  />
                  <div className="space-y-2 text-xs">
                    <div>
                      <p className="text-[10px] font-medium text-ink-muted">Positive prompt</p>
                      <p className="text-ink">{lastSuccess.payload.prompt}</p>
                    </div>
                    {lastSuccess.payload.parameters.negative_prompt ? (
                      <div>
                        <p className="text-[10px] font-medium text-ink-muted">Negative prompt</p>
                        <p className="text-ink-soft">
                          {lastSuccess.payload.parameters.negative_prompt}
                        </p>
                      </div>
                    ) : null}
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-ink-muted">
                      <span>
                        Size: {lastSuccess.payload.parameters.size?.replace("*", "\u00d7")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            <Button
              type="button"
              variant="ghost"
              onPress={() => {
                if (!window.confirm("Discard this ad graphic draft?")) {
                  return;
                }
                setFormValues(defaultAdGraphicsValues);
                setTemplateSelections({});
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
        title="Product Shoot Workflow"
        description="Upload a product image, choose a use case, and generate refined ad-ready variants."
        demoGuide={{ color: "orange", variant: "product-shoot" }}
        steps={AD_STEPS}
        statuses={stepStatuses}
        currentStep={boundedStep}
        onStepSelect={(index) => setCurrentStep(index)}
        canSelectStep={(index) => {
          if (index === 1 && !lastSuccess) {
            return false;
          }
          return canNavigateToStep(index, boundedStep, stepValidity);
        }}
        onBack={() => {
          if (boundedStep === 1) {
            setCurrentStep(0);
          }
        }}
        canBack={boundedStep > 0}
        onPrimaryAction={() => {
          if (boundedStep === 0) {
            handleGenerate();
            return;
          }
          setCurrentStep(0);
        }}
        primaryActionLabel={boundedStep === 0 ? "Generate" : "Back to Edit"}
        primaryActionPendingLabel="Generating\u2026"
        primaryActionTone={boundedStep === 0 ? "primary" : "secondary"}
        isPrimaryPending={mutation.isPending}
      >
        {renderStepContent()}
      </StudioStepperLayout>
    </div>
  );
}
