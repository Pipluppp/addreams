import { useState } from "react";
import type {
  ProductShootsValidationErrors,
  ProductShootsFormValues,
} from "../../features/product-shoots/schema";
import { NegativePromptTextarea } from "../../features/parameters/components/negative-prompt-textarea";
import { OutputFormatSelect } from "../../features/parameters/components/output-format-select";
import { PromptExtendToggle } from "../../features/parameters/components/prompt-extend-toggle";
import { PromptTextarea } from "../../features/parameters/components/prompt-textarea";
import { SeedInput } from "../../features/parameters/components/seed-input";
import { SizePresetSelect } from "../../features/parameters/components/size-preset-select";
import { WatermarkToggle } from "../../features/parameters/components/watermark-toggle";
import { GenerateButton } from "../molecules/GenerateButton";

type ProductShootsFormProps = {
  values: ProductShootsFormValues;
  errors: ProductShootsValidationErrors;
  isPending: boolean;
  canReuseSettings: boolean;
  onReuseSettings: () => void;
  onChange: (next: ProductShootsFormValues) => void;
  onSubmit: () => void;
};

export function ProductShootsForm({
  values,
  errors,
  isPending,
  canReuseSettings,
  onReuseSettings,
  onChange,
  onSubmit,
}: ProductShootsFormProps) {
  const [advancedOpen, setAdvancedOpen] = useState(false);

  return (
    <form
      className="space-y-5"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <PromptTextarea
        id="product-prompt"
        value={values.prompt}
        onChange={(next) => onChange({ ...values, prompt: next })}
        error={errors.prompt}
      />

      <div className="space-y-3 bg-canvas p-4">
        <button
          type="button"
          className="inline-flex items-center text-sm font-semibold uppercase tracking-[0.08em] text-ink transition-colors duration-200 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-frame focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
          onClick={() => setAdvancedOpen((current) => !current)}
          aria-expanded={advancedOpen}
          aria-controls="product-advanced-options"
        >
          Advanced options {advancedOpen ? "-" : "+"}
        </button>

        {advancedOpen ? (
          <div id="product-advanced-options" className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <NegativePromptTextarea
                id="product-negative-prompt"
                value={values.negative_prompt}
                onChange={(next) => onChange({ ...values, negative_prompt: next })}
                error={errors.negative_prompt}
              />
            </div>
            <SizePresetSelect
              id="product-size"
              value={values.size}
              onChange={(next) =>
                onChange({ ...values, size: next as ProductShootsFormValues["size"] })
              }
              error={errors.size}
            />
            <OutputFormatSelect
              id="product-output-format"
              value={values.output_format}
              onChange={(next) => onChange({ ...values, output_format: next })}
              error={errors.output_format}
            />
            <SeedInput
              id="product-seed"
              value={values.seed}
              onChange={(next) => onChange({ ...values, seed: next })}
              error={errors.seed}
            />
            <div className="space-y-3">
              <PromptExtendToggle
                id="product-prompt-extend"
                checked={values.prompt_extend}
                onChange={(next) => onChange({ ...values, prompt_extend: next })}
              />
              <WatermarkToggle
                id="product-watermark"
                checked={values.watermark}
                onChange={(next) => onChange({ ...values, watermark: next })}
              />
            </div>
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-3">
        <GenerateButton
          label="Generate Product Shoot"
          pendingLabel="Generating Product Shoot..."
          isPending={isPending}
        />
        {canReuseSettings ? (
          <button
            type="button"
            onClick={onReuseSettings}
            className="bg-surface px-4 py-2 text-sm font-semibold text-ink transition-colors duration-200 hover:bg-surface-alt focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-frame focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
          >
            Reuse settings
          </button>
        ) : null}
      </div>
    </form>
  );
}
