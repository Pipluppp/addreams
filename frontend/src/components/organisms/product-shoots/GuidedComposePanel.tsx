import { Button } from "@heroui/react";
import { ArrowLeft, Pencil } from "lucide-react";
import type { ProductShootsTemplate } from "../../../features/product-shoots/templates";
import { ImageDropzone } from "../../molecules/ImageDropzone";
import { AspectRatioChipSelect } from "../../studio/AspectRatioChipSelect";

type AspectOption = {
  id: string;
  label: string;
};

type GuidedComposePanelProps = {
  referencePreviewUrl: string | null;
  referenceError?: string;
  remainingCredits: number;
  hasLowCredits: boolean;
  isOutOfCredits: boolean;
  selectedTemplates: ProductShootsTemplate[];
  selectedTemplateCount: number;
  maxTemplateCount: number;
  aspectRatioId: string;
  aspectRatioOptions: AspectOption[];
  isPending: boolean;
  canContinue: boolean;
  onReferenceFileSelected: (file: File) => void;
  onClearReference: () => void;
  onOpenTemplatePicker: () => void;
  onAspectRatioChange: (value: string) => void;
  onBackToEntry: () => void;
  onContinueToWorkspace: () => void;
};

export function GuidedComposePanel({
  referencePreviewUrl,
  referenceError,
  remainingCredits,
  hasLowCredits,
  isOutOfCredits,
  selectedTemplates,
  selectedTemplateCount,
  maxTemplateCount,
  aspectRatioId,
  aspectRatioOptions,
  isPending,
  canContinue,
  onReferenceFileSelected,
  onClearReference,
  onOpenTemplatePicker,
  onAspectRatioChange,
  onBackToEntry,
  onContinueToWorkspace,
}: GuidedComposePanelProps) {
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="accent-type text-[10px] uppercase tracking-[0.16em] text-studio-text-muted">
            Photoshoot Setup
          </p>
          <h2 className="ui-title text-studio-text">Product Photoshoot with Templates</h2>
        </div>
        <div className="text-right text-xs text-studio-text-muted">
          {isOutOfCredits ? (
            <p className="text-error">Out of credits</p>
          ) : hasLowCredits ? (
            <p>{remainingCredits} credit left</p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <article className="space-y-3">
          <div className="flex min-h-11 items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-studio-text">Product Image</h3>
            {referencePreviewUrl ? (
              <Button
                isIconOnly
                type="button"
                variant="ghost"
                aria-label="Change product image"
                onPress={onClearReference}
                className="rounded-full border border-studio-border bg-studio-surface"
              >
                <Pencil className="size-6" aria-hidden="true" />
              </Button>
            ) : null}
          </div>

          {referencePreviewUrl ? (
            <div className="flex">
              <div className="inline-block max-w-full overflow-hidden rounded-xl border border-studio-border bg-studio-surface">
                <img
                  src={referencePreviewUrl}
                  alt="Product reference"
                  width={1000}
                  height={1000}
                  className="block h-auto max-h-[34rem] w-auto max-w-full object-contain"
                />
              </div>
            </div>
          ) : (
            <ImageDropzone
              onFileSelected={onReferenceFileSelected}
              error={referenceError}
              buttonId="product-reference-upload-button"
              panelClassName="h-60 rounded-xl border border-dashed border-studio-border bg-studio-surface"
            />
          )}
        </article>

        <article className="space-y-3">
          <div className="flex min-h-11 items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-studio-text">Photoshoot Templates</h3>
            <div className="flex items-center gap-2">
              <span className="rounded-full border border-studio-border bg-studio-surface px-2 py-0.5 text-[11px] text-studio-text-muted">
                {selectedTemplateCount}/{maxTemplateCount}
              </span>
              <Button
                isIconOnly
                type="button"
                variant="ghost"
                aria-label="Edit templates"
                onPress={onOpenTemplatePicker}
                className="rounded-full border border-studio-border bg-studio-surface"
                isDisabled={!referencePreviewUrl}
              >
                <Pencil className="size-6" aria-hidden="true" />
              </Button>
            </div>
          </div>

          {selectedTemplates.length ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {selectedTemplates.map((template) => (
                <article key={template.id} className="overflow-hidden rounded-xl border border-studio-border bg-studio-surface">
                  <div
                    className="h-24"
                    style={{
                      backgroundImage: `linear-gradient(145deg, ${template.preview.gradientFrom}, ${template.preview.gradientTo})`,
                    }}
                  />
                  <div className="px-2 py-1.5">
                    <p className="text-[11px] font-semibold text-studio-text">{template.label}</p>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenTemplatePicker}
              disabled={!referencePreviewUrl}
              className="grid h-60 w-full place-items-center rounded-xl border border-dashed border-studio-border bg-studio-surface text-sm text-studio-text-muted disabled:cursor-not-allowed disabled:opacity-50"
            >
              Select templates
            </button>
          )}
        </article>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-3 pt-1">
        <AspectRatioChipSelect
          value={aspectRatioId}
          options={aspectRatioOptions}
          onChange={onAspectRatioChange}
          isDisabled={isPending}
        />

        <div className="ml-auto flex items-center gap-2">
          <Button
            isIconOnly
            type="button"
            variant="ghost"
            onPress={onBackToEntry}
            aria-label="Back"
            className="rounded-full border border-studio-border bg-studio-surface-alt"
            isDisabled={isPending}
          >
            <ArrowLeft className="size-6" aria-hidden="true" />
          </Button>

          <Button
            type="button"
            variant="primary"
            onPress={onContinueToWorkspace}
            isDisabled={!canContinue || isPending}
          >
            Continue
          </Button>
        </div>
      </div>
    </section>
  );
}
