import { useAtom } from "jotai";
import { useEffect, useState } from "react";
import { Button, Card, Disclosure } from "@heroui/react";
import { NegativePromptTextarea } from "../../components/molecules/NegativePromptTextarea";
import { OutputFormatSelect } from "../../components/molecules/OutputFormatSelect";
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
  { id: "compose", label: "Your Ad Graphic" },
  { id: "result", label: "Result & Iterate" },
] as const;

const PRODUCT_FIELD_IDS: Record<ProductShootsField, string> = {
  prompt: "product-prompt",
  negative_prompt: "product-negative-prompt",
  size: "product-size",
  output_format: "product-output-format",
};

function validateProductStep(
  step: number,
  errors: ProductShootsValidationErrors,
  hasSuccess: boolean,
) {
  if (step === 0) {
    return !errors.prompt && !errors.negative_prompt && !errors.size && !errors.output_format;
  }
  return hasSuccess;
}

export default function ProductShootsRoute() {
  const [formValues, setFormValues] = useAtom(productShootsFormAtom);
  const [currentStep, setCurrentStep] = useAtom(productShootsStepAtom);
  const [lastSuccess, setLastSuccess] = useAtom(productShootsLastSuccessAtom);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [errors, setErrors] = useState<ProductShootsValidationErrors>({});
  const [advancedOpen, setAdvancedOpen] = useState(false);
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

  function handleGenerate() {
    if (!validation.isValid) {
      setErrors(validation.errors);
      focusFirstError(validation.errors, PRODUCT_FIELD_IDS);
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

  function renderStepContent() {
    const generatedImages = lastSuccess ? getWorkflowOutputImages(lastSuccess.response) : [];
    const firstGeneratedImageUrl = generatedImages[0]?.url;
    const isCompleted = lastSuccess ? isWorkflowCompletedResponse(lastSuccess.response) : false;

    if (boundedStep === 0) {
      return (
        <Card className="space-y-5 bg-surface-alt p-5 sm:p-6">
          {/* Prompt */}
          <div className="space-y-3 rounded-xl bg-canvas p-5">
            <PromptTextarea
              id="product-prompt"
              label="Ad Graphic Prompt"
              value={formValues.prompt}
              onChange={(next) => setFormValues({ ...formValues, prompt: next })}
              error={errors.prompt}
            />
          </div>

          {/* Size & Format */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-3 rounded-xl bg-canvas p-5">
              <p className="accent-type text-[10px] uppercase tracking-[0.16em] text-ink-muted">
                Canvas
              </p>
              <SizePresetSelect
                id="product-size"
                value={formValues.size}
                onChange={(next) =>
                  setFormValues({ ...formValues, size: next as typeof formValues.size })
                }
                error={errors.size}
              />
            </div>
            <div className="space-y-3 rounded-xl bg-canvas p-5">
              <p className="accent-type text-[10px] uppercase tracking-[0.16em] text-ink-muted">
                Export
              </p>
              <OutputFormatSelect
                id="product-output-format"
                value={formValues.output_format}
                onChange={(next) => setFormValues({ ...formValues, output_format: next })}
                error={errors.output_format}
              />
            </div>
          </div>

          {/* Advanced Options */}
          <div className="rounded-xl bg-canvas p-5">
            <Disclosure isExpanded={advancedOpen} onExpandedChange={setAdvancedOpen}>
              <Disclosure.Heading>
                <Disclosure.Trigger className="flex w-full cursor-pointer items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Disclosure.Indicator />
                    <span className="text-xs font-medium text-ink-soft">Advanced Options</span>
                  </div>
                  {!advancedOpen && formValues.negative_prompt.trim() ? (
                    <span className="text-[10px] text-ink-muted">Negative prompt applied</span>
                  ) : null}
                </Disclosure.Trigger>
              </Disclosure.Heading>
              <Disclosure.Content>
                <Disclosure.Body className="space-y-4 pt-4">
                  <NegativePromptTextarea
                    id="product-negative-prompt"
                    value={formValues.negative_prompt}
                    onChange={(next) => setFormValues({ ...formValues, negative_prompt: next })}
                    error={errors.negative_prompt}
                  />
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
        emptyLabel="No generation yet. Complete the form and hit Generate."
        loadingLabel="Generating ad graphic\u2026"
        onIterate={() => setCurrentStep(0)}
        iterateLabel="Back to Edit"
        successContent={
          <Card className="space-y-5 p-4 sm:p-5">
            <p className="text-sm text-ink-soft">
              {isCompleted
                ? "Generation completed. Review the image below and iterate if needed."
                : "Request accepted by workflow. Image preview appears when generated output is returned."}
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

            {/* Input summary */}
            {lastSuccess ? (
              <div className="space-y-2 rounded-xl bg-surface-alt p-4">
                <p className="accent-type text-[10px] uppercase tracking-[0.16em] text-ink-muted">
                  Input Used
                </p>
                <div className="space-y-1.5 text-xs">
                  <div>
                    <p className="text-[10px] font-medium text-ink-muted">Prompt</p>
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
                    <span>Format: {lastSuccess.payload.parameters.output_format ?? "png"}</span>
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
                setFormValues(defaultProductShootsValues);
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
        workflow="Ad Graphics"
        title="Text-to-Image Ad Graphic"
        description="Describe your ad graphic, choose size and format, then generate."
        steps={PRODUCT_STEPS}
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
