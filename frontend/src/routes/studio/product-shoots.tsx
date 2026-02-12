import { useAtom } from "jotai";
import { useState } from "react";
import { SectionShell } from "../../components/atoms/SectionShell";
import { ProductShootsForm } from "../../components/organisms/ProductShootsForm";
import { GenerationResultFrame } from "../../components/organisms/GenerationResultFrame";
import { useProductShootsMutation } from "../../features/product-shoots/use-product-shoots-mutation";
import { focusFirstError } from "../../lib/focus-first-error";
import {
  defaultProductShootsValues,
  productShootsFormAtom,
  productShootsLastSuccessAtom,
} from "../../features/product-shoots/state";
import {
  validateProductShootsForm,
  type ProductShootsField,
  type ProductShootsValidationErrors,
} from "../../features/product-shoots/schema";

const PRODUCT_FIELD_IDS: Record<ProductShootsField, string> = {
  prompt: "product-prompt",
  negative_prompt: "product-negative-prompt",
  size: "product-size",
  seed: "product-seed",
  output_format: "product-output-format",
};

export default function ProductShootsRoute() {
  const [formValues, setFormValues] = useAtom(productShootsFormAtom);
  const [lastSuccess, setLastSuccess] = useAtom(productShootsLastSuccessAtom);
  const [errors, setErrors] = useState<ProductShootsValidationErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const mutation = useProductShootsMutation();

  function handleSubmit() {
    const validation = validateProductShootsForm(formValues);
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
      },
      onError: (error) => {
        setSubmitError(error instanceof Error ? error.message : "Request failed.");
      },
    });
  }

  function handleReuseSettings() {
    if (!lastSuccess) {
      return;
    }

    const seed = lastSuccess.payload.parameters.seed;
    setFormValues({
      prompt: lastSuccess.payload.prompt,
      negative_prompt: lastSuccess.payload.parameters.negative_prompt ?? "",
      size: lastSuccess.payload.parameters.size,
      seed: typeof seed === "number" ? String(seed) : "",
      prompt_extend: lastSuccess.payload.parameters.prompt_extend,
      watermark: lastSuccess.payload.parameters.watermark,
      output_format: lastSuccess.payload.parameters.output_format,
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_0.95fr]">
      <SectionShell
        eyebrow="Workflow"
        heading="Product Shoots"
        description="Text-to-image generation with Qwen-ready parameters and stub backend execution."
        actions={
          <button
            type="button"
            onClick={() => {
              setFormValues(defaultProductShootsValues);
              setErrors({});
            }}
            className="border border-frame bg-surface px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-ink transition-colors duration-200 hover:border-accent"
          >
            Reset form
          </button>
        }
      >
        <ProductShootsForm
          values={formValues}
          errors={errors}
          isPending={mutation.isPending}
          canReuseSettings={Boolean(lastSuccess)}
          onReuseSettings={handleReuseSettings}
          onChange={setFormValues}
          onSubmit={handleSubmit}
        />
      </SectionShell>

      <SectionShell
        eyebrow="Results"
        heading="Generation Result"
        description="Stub response metadata and the parameter snapshot from your most recent request."
      >
        <GenerationResultFrame
          isPending={mutation.isPending}
          submitError={submitError}
          successRecord={lastSuccess}
        />
      </SectionShell>
    </div>
  );
}
