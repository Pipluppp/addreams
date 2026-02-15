import { useAtom } from "jotai";
import { useEffect, useState } from "react";
import { Button, Card } from "@heroui/react";
import { NegativePromptTextarea } from "../../components/molecules/NegativePromptTextarea";
import { OutputFormatSelect } from "../../components/molecules/OutputFormatSelect";
import { PromptExtendToggle } from "../../components/molecules/PromptExtendToggle";
import { PromptTextarea } from "../../components/molecules/PromptTextarea";
import { ResultMetadataChips } from "../../components/molecules/ResultMetadataChips";
import { SizePresetSelect } from "../../components/molecules/SizePresetSelect";
import { ResultPanel } from "../../components/organisms/ResultPanel";
import { StudioStepperLayout } from "../../components/organisms/StudioStepperLayout";
import {
  defaultProductShootsValues,
  productShootsFormAtom,
  productShootsLastSuccessAtom,
  productShootsStepAtom,
} from "../../features/product-shoots/state";
import { useProductShootsMutation } from "../../features/product-shoots/use-product-shoots-mutation";
import { focusFirstError } from "../../lib/focus-first-error";
import { getWorkflowOutputImages, isWorkflowCompletedResponse } from "../../lib/api";
import { canNavigateToStep, deriveStepStatuses } from "../../lib/stepper";
import {
  validateProductShootsForm,
  type ProductShootsField,
  type ProductShootsValidationErrors,
} from "../../features/product-shoots/schema";

const PRODUCT_STEPS = [
  { id: "brief", label: "Creative Brief" },
  { id: "inputs", label: "Inputs" },
  { id: "controls", label: "Creative Controls" },
  { id: "result", label: "Result & Iterate" },
] as const;

const PRODUCT_FIELD_IDS: Record<ProductShootsField, string> = {
  prompt: "product-prompt",
  negative_prompt: "product-negative-prompt",
  size: "product-size",
  seed: "product-seed",
  output_format: "product-output-format",
};

function validateProductStep(
  step: number,
  errors: ProductShootsValidationErrors,
  hasSuccess: boolean,
) {
  if (step === 0) {
    return !errors.prompt;
  }
  if (step === 1) {
    return !errors.size && !errors.output_format;
  }
  if (step === 2) {
    return !errors.negative_prompt;
  }
  return hasSuccess;
}

export default function ProductShootsRoute() {
  const [formValues, setFormValues] = useAtom(productShootsFormAtom);
  const [currentStep, setCurrentStep] = useAtom(productShootsStepAtom);
  const [lastSuccess, setLastSuccess] = useAtom(productShootsLastSuccessAtom);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [errors, setErrors] = useState<ProductShootsValidationErrors>({});
  const mutation = useProductShootsMutation();

  const boundedStep = Math.max(0, Math.min(PRODUCT_STEPS.length - 1, currentStep));
  useEffect(() => {
    if (boundedStep !== currentStep) {
      setCurrentStep(boundedStep);
    }
  }, [boundedStep, currentStep, setCurrentStep]);

  const validation = validateProductShootsForm(formValues);
  const stepValidity = PRODUCT_STEPS.map((_, index) =>
    validateProductStep(index, validation.errors, Boolean(lastSuccess)),
  );
  const stepStatuses = deriveStepStatuses(boundedStep, stepValidity);

  function setValidationErrors(nextErrors: ProductShootsValidationErrors) {
    setErrors(nextErrors);
  }

  function focusStepError(step: number, stepErrors: ProductShootsValidationErrors) {
    const stepFieldOrder: Record<number, ProductShootsField[]> = {
      0: ["prompt"],
      1: ["size", "output_format"],
      2: ["negative_prompt"],
      3: [],
    };

    for (const field of stepFieldOrder[step] ?? []) {
      if (stepErrors[field]) {
        focusFirstError(stepErrors, PRODUCT_FIELD_IDS);
        return;
      }
    }
  }

  function handleContinue() {
    if (!validateProductStep(boundedStep, validation.errors, Boolean(lastSuccess))) {
      setValidationErrors(validation.errors);
      focusStepError(boundedStep, validation.errors);
      return;
    }

    setSubmitError(null);
    setCurrentStep((step) => Math.min(step + 1, PRODUCT_STEPS.length - 1));
  }

  function handleGenerate() {
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      focusFirstError(validation.errors, PRODUCT_FIELD_IDS);
      return;
    }

    setValidationErrors({});
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

  function renderStepContent() {
    const generatedImages = lastSuccess ? getWorkflowOutputImages(lastSuccess.response) : [];
    const firstGeneratedImageUrl = generatedImages[0]?.url;
    const isCompleted = lastSuccess ? isWorkflowCompletedResponse(lastSuccess.response) : false;

    if (boundedStep === 0) {
      return (
        <Card className="space-y-4 bg-surface-alt p-5 sm:p-6">
          <div className="space-y-3 rounded-xl bg-canvas p-5">
            <PromptTextarea
              id="product-prompt"
              label="Ad Graphic Prompt"
              value={formValues.prompt}
              onChange={(next) => setFormValues({ ...formValues, prompt: next })}
              error={errors.prompt}
            />
          </div>
        </Card>
      );
    }

    if (boundedStep === 1) {
      return (
        <Card className="grid gap-4 bg-surface-alt p-5 sm:grid-cols-2 sm:p-6">
          <div className="space-y-3 rounded-xl bg-canvas p-5">
            <p className="accent-type text-[10px] uppercase tracking-[0.16em] text-ink-muted">
              Canvas
            </p>
            <p className="text-xs text-ink-soft">
              Select a stable aspect ratio before generation so outputs are consistent.
            </p>
            <SizePresetSelect
              id="product-size"
              value={formValues.size}
              onChange={(next) => setFormValues({ ...formValues, size: next as typeof formValues.size })}
              error={errors.size}
              helperText="Use approved presets for stable generation dimensions."
            />
          </div>
          <div className="space-y-3 rounded-xl bg-canvas p-5">
            <p className="accent-type text-[10px] uppercase tracking-[0.16em] text-ink-muted">
              Export
            </p>
            <p className="text-xs text-ink-soft">
              Define output type early to keep review and downstream usage predictable.
            </p>
            <OutputFormatSelect
              id="product-output-format"
              value={formValues.output_format}
              onChange={(next) => setFormValues({ ...formValues, output_format: next })}
              error={errors.output_format}
            />
          </div>
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
              id="product-negative-prompt"
              value={formValues.negative_prompt}
              onChange={(next) => setFormValues({ ...formValues, negative_prompt: next })}
              error={errors.negative_prompt}
            />
          </div>
          <div className="space-y-3 rounded-xl bg-canvas p-5">
            <p className="accent-type text-[10px] uppercase tracking-[0.16em] text-ink-muted">
              Generation Option
            </p>
            <PromptExtendToggle
              id="product-prompt-extend"
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
        emptyLabel="No generation yet. Complete controls and generate your first ad graphic."
        loadingLabel="Generating ad graphic…"
        onIterate={() => setCurrentStep(2)}
        iterateLabel="Back to Controls"
        successContent={
          <Card className="space-y-4 p-4 sm:p-5">
            <p className="text-sm text-ink-soft">
              {isCompleted
                ? "Generation completed. Review the returned image below and iterate from controls if needed."
                : "Request accepted by workflow. Image preview appears when the backend returns generated output."}
            </p>
            {lastSuccess ? <ResultMetadataChips response={lastSuccess.response} /> : null}
            {firstGeneratedImageUrl ? (
              <div className="space-y-2">
                <p className="accent-type text-[10px] uppercase tracking-[0.16em] text-ink-muted">
                  Generated Image
                </p>
                <img
                  src={firstGeneratedImageUrl}
                  alt="Generated ad graphic"
                  width={1400}
                  height={1400}
                  loading="lazy"
                  decoding="async"
                  className="h-auto max-h-[26rem] w-full rounded-xl bg-surface-alt object-contain"
                />
                <a
                  href={firstGeneratedImageUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex text-xs font-medium text-ink hover:text-ink-soft"
                >
                  Open full image URL
                </a>
              </div>
            ) : null}
            {lastSuccess ? (
              <pre className="max-h-72 overflow-auto bg-surface-alt p-3 text-xs text-ink-soft">
                {JSON.stringify(lastSuccess.payload.parameters, null, 2)}
              </pre>
            ) : null}
            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                variant="ghost"
                onPress={() => {
                  if (!window.confirm("Discard this product shoot draft?")) {
                    return;
                  }
                  setFormValues(defaultProductShootsValues);
                  setErrors({});
                  setSubmitError(null);
                  setCurrentStep(0);
                }}
              >
                Reset Draft
              </Button>
            </div>
          </Card>
        }
      />
    );
  }

  return (
    <div className="container-shell py-6 sm:py-8">
      <StudioStepperLayout
        workflow="Ad Graphics"
        title="Text-to-Image Ad Graphic Creation"
        description="Move from brief to generated ad concepts with progressive validation and clear controls."
        steps={PRODUCT_STEPS}
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
