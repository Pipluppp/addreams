import { useEffect, useState } from "react";
import type {
  AdGraphicsValidationErrors,
  AdGraphicsFormValues,
} from "../../features/ad-graphics/schema";
import { EditInstructionTextarea } from "../../features/parameters/components/edit-instruction-textarea";
import { NegativePromptTextarea } from "../../features/parameters/components/negative-prompt-textarea";
import { PromptExtendToggle } from "../../features/parameters/components/prompt-extend-toggle";
import { SeedInput } from "../../features/parameters/components/seed-input";
import { SizePresetSelect } from "../../features/parameters/components/size-preset-select";
import { WatermarkToggle } from "../../features/parameters/components/watermark-toggle";
import { TextField } from "../atoms/TextField";
import { ToggleField } from "../atoms/ToggleField";
import { GenerateButton } from "../molecules/GenerateButton";
import { ImageDropzone } from "../molecules/ImageDropzone";
import { ImagePreviewCard } from "../molecules/ImagePreviewCard";
import { ReferenceImageInputTabs } from "../molecules/ReferenceImageInputTabs";

type AdGraphicsPanelProps = {
  values: AdGraphicsFormValues;
  errors: AdGraphicsValidationErrors;
  isPending: boolean;
  onChange: (next: AdGraphicsFormValues) => void;
  onFileSelected: (file: File) => void;
  onSubmit: () => void;
  onClearForm: () => void;
};

export function AdGraphicsPanel({
  values,
  errors,
  isPending,
  onChange,
  onFileSelected,
  onSubmit,
  onClearForm,
}: AdGraphicsPanelProps) {
  const [uploadPreviewUrl, setUploadPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (values.referenceMode !== "upload" || !values.referenceImageFile) {
      setUploadPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(values.referenceImageFile);
    setUploadPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [values.referenceMode, values.referenceImageFile]);

  const previewUrl =
    values.referenceMode === "url" ? values.referenceImageUrl.trim() || null : uploadPreviewUrl;

  return (
    <form
      className="space-y-5"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <div className="space-y-3">
        <ReferenceImageInputTabs
          value={values.referenceMode}
          onChange={(mode) =>
            onChange({
              ...values,
              referenceMode: mode,
              referenceImageUrl: mode === "url" ? values.referenceImageUrl : "",
              referenceImageFile: mode === "upload" ? values.referenceImageFile : null,
            })
          }
        />

        {values.referenceMode === "url" ? (
          <TextField
            id="reference-image-url"
            label="Reference image URL"
            value={values.referenceImageUrl}
            onChange={(event) =>
              onChange({
                ...values,
                referenceImageUrl: event.target.value,
              })
            }
            placeholder="https://example.com/reference.png"
            error={errors.referenceImageUrl}
          />
        ) : (
          <ImageDropzone
            onFileSelected={onFileSelected}
            error={errors.referenceImage}
            buttonId="reference-upload-button"
          />
        )}

        {previewUrl ? (
          <ImagePreviewCard
            src={previewUrl}
            alt="Reference preview"
            onSwap={() => {
              if (values.referenceMode === "upload") {
                onChange({ ...values, referenceImageFile: null });
              }
            }}
            onClear={() => {
              onChange({
                ...values,
                referenceImageFile: null,
                referenceImageUrl: "",
              });
            }}
          />
        ) : null}
      </div>

      <EditInstructionTextarea
        id="edit-instruction"
        value={values.prompt}
        onChange={(next) => onChange({ ...values, prompt: next })}
        error={errors.prompt}
      />
      <p className="text-xs text-muted">
        Tip: call out exact zones like \"replace the top-left logo with matte silver text.\"
      </p>

      <div className="grid gap-4 bg-canvas p-4 md:grid-cols-2">
        <div className="space-y-3 md:col-span-2">
          <NegativePromptTextarea
            id="ad-graphics-negative-prompt"
            value={values.negative_prompt}
            onChange={(next) => onChange({ ...values, negative_prompt: next })}
            error={errors.negative_prompt}
          />
        </div>

        <div className="space-y-3">
          <ToggleField
            id="custom-size-toggle"
            label="Custom size mode"
            helperText="Enable manual width/height constraints for image edit output."
            checked={values.sizeMode === "custom"}
            onChange={(event) =>
              onChange({
                ...values,
                sizeMode: event.target.checked ? "custom" : "preset",
              })
            }
          />

          {values.sizeMode === "preset" ? (
            <SizePresetSelect
              id="ad-size-preset"
              value={values.sizePreset}
              onChange={(next) =>
                onChange({ ...values, sizePreset: next as AdGraphicsFormValues["sizePreset"] })
              }
              helperText="Preset sizes are safest for the current model profile."
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              <TextField
                id="custom-size-width"
                label="Custom width"
                value={values.customWidth}
                onChange={(event) => onChange({ ...values, customWidth: event.target.value })}
                inputMode="numeric"
                placeholder="1024"
              />
              <TextField
                id="custom-size-height"
                label="Custom height"
                value={values.customHeight}
                onChange={(event) => onChange({ ...values, customHeight: event.target.value })}
                inputMode="numeric"
                placeholder="1024"
              />
              {errors.customSize ? (
                <p className="text-xs text-error sm:col-span-2">{errors.customSize}</p>
              ) : null}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <SeedInput
            id="ad-seed"
            value={values.seed}
            onChange={(next) => onChange({ ...values, seed: next })}
            error={errors.seed}
          />
          <PromptExtendToggle
            id="ad-prompt-extend"
            checked={values.prompt_extend}
            onChange={(next) => onChange({ ...values, prompt_extend: next })}
          />
          <WatermarkToggle
            id="ad-watermark"
            checked={values.watermark}
            onChange={(next) => onChange({ ...values, watermark: next })}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <GenerateButton
          label="Generate Ad Graphic"
          pendingLabel="Generating Ad Graphic..."
          isPending={isPending}
        />
        <button
          type="button"
          onClick={onClearForm}
          className="bg-surface px-4 py-2 text-sm font-semibold text-ink transition-colors duration-200 hover:bg-surface-alt focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-frame focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
        >
          Clear form
        </button>
      </div>
    </form>
  );
}
