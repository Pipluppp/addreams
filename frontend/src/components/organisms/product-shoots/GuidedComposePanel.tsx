import { useId, useRef, useState, type ChangeEvent, type KeyboardEvent } from "react";
import { Button, Modal } from "@heroui/react";
import { Pencil } from "lucide-react";
import type { ProductShootsTemplate } from "../../../features/product-shoots/templates";
import { cn } from "../../../lib/cn";
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
  onOpenTemplatePicker: () => void;
  onAspectRatioChange: (value: string) => void;
  onGenerate: () => void;
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
  onOpenTemplatePicker,
  onAspectRatioChange,
  onGenerate,
}: GuidedComposePanelProps) {
  const [isGenerateConfirmOpen, setIsGenerateConfirmOpen] = useState(false);
  const replaceInputId = useId();
  const replaceInputRef = useRef<HTMLInputElement | null>(null);

  function openReferenceReplacementDialog() {
    if (!referencePreviewUrl || isPending) {
      return;
    }

    replaceInputRef.current?.click();
  }

  function handleReferenceReplacement(event: ChangeEvent<HTMLInputElement>) {
    const next = event.target.files?.[0];
    if (next) {
      onReferenceFileSelected(next);
    }
    event.currentTarget.value = "";
  }

  function handleGeneratePress() {
    if (!canContinue || isPending) {
      return;
    }

    setIsGenerateConfirmOpen(true);
  }

  function handleConfirmGenerate() {
    setIsGenerateConfirmOpen(false);
    onGenerate();
  }

  const canOpenTemplatePicker = Boolean(referencePreviewUrl) && !isPending;

  function handleSelectedTemplatesPress() {
    if (!canOpenTemplatePicker) {
      return;
    }

    onOpenTemplatePicker();
  }

  function handleSelectedTemplatesKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!canOpenTemplatePicker) {
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onOpenTemplatePicker();
    }
  }

  return (
    <>
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="accent-type text-[10px] uppercase tracking-[0.16em] text-studio-text-muted">
              Product Shoots Setup
            </p>
            <h2 className="ui-title text-studio-text">Product Shoots with Templates</h2>
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
            </div>

            {referencePreviewUrl ? (
              <div className="space-y-2">
                <input
                  id={replaceInputId}
                  ref={replaceInputRef}
                  type="file"
                  className="sr-only"
                  aria-label="Change product image"
                  accept="image/jpeg,image/png,image/bmp,image/webp,image/tiff,image/gif"
                  onChange={handleReferenceReplacement}
                />
                <button
                  type="button"
                  onClick={openReferenceReplacementDialog}
                  disabled={isPending}
                  aria-label="Change product image"
                  className="group relative inline-block max-w-full overflow-hidden rounded-xl border border-studio-border bg-studio-surface text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-studio-accent/70 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <img
                    src={referencePreviewUrl}
                    alt="Product reference"
                    width={1000}
                    height={1000}
                    className="block h-auto max-h-[34rem] w-auto max-w-full object-contain transition group-hover:opacity-72 group-focus-visible:opacity-72"
                  />
                  <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition group-hover:bg-black/22 group-hover:opacity-100 group-focus-visible:bg-black/22 group-focus-visible:opacity-100">
                    <span className="inline-flex size-8 items-center justify-center rounded-full border border-white/55 bg-black/40 text-white">
                      <Pencil className="size-4" aria-hidden="true" />
                    </span>
                  </span>
                </button>
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
              <h3 className="text-sm font-semibold text-studio-text">Product Shoot Templates</h3>
              <span className="rounded-full border border-studio-border bg-studio-surface px-2 py-0.5 text-[11px] text-studio-text-muted">
                {selectedTemplateCount}/{maxTemplateCount}
              </span>
            </div>

            {selectedTemplates.length ? (
              <div
                role="button"
                tabIndex={canOpenTemplatePicker ? 0 : -1}
                aria-disabled={!canOpenTemplatePicker}
                aria-label="Edit selected templates"
                onClick={handleSelectedTemplatesPress}
                onKeyDown={handleSelectedTemplatesKeyDown}
                className={cn(
                  "group relative block w-full rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-studio-accent/70",
                  !canOpenTemplatePicker && "cursor-not-allowed opacity-60",
                )}
              >
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
                <span className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-xl bg-black/0 opacity-0 transition group-hover:bg-black/20 group-hover:opacity-100 group-focus-visible:bg-black/20 group-focus-visible:opacity-100">
                  <span className="inline-flex size-8 items-center justify-center rounded-full border border-white/55 bg-black/40 text-white">
                    <Pencil className="size-4" aria-hidden="true" />
                  </span>
                </span>
              </div>
            ) : (
              <button
                type="button"
                onClick={onOpenTemplatePicker}
                disabled={!canOpenTemplatePicker}
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
              type="button"
              variant="primary"
              onPress={handleGeneratePress}
              isDisabled={!canContinue || isPending}
            >
              Generate
            </Button>
          </div>
        </div>
      </section>

      <Modal.Backdrop
        isOpen={isGenerateConfirmOpen}
        onOpenChange={setIsGenerateConfirmOpen}
        variant="blur"
        className="bg-black/32 backdrop-blur-md"
      >
        <Modal.Container placement="center" className="p-4">
          <Modal.Dialog className="w-[min(560px,96vw)] rounded-3xl border border-studio-border bg-studio-surface p-0">
            <div className="space-y-4 p-5">
              <header className="space-y-1">
                <p className="accent-type text-[10px] uppercase tracking-[0.16em] text-studio-text-muted">
                  Confirm Generation
                </p>
                <h3 className="ui-title text-studio-text">Generate Product Shoots</h3>
              </header>

              <p className="text-sm text-studio-text-muted">
                Your uploaded product image will be used to generate product shoots with the selected templates.
              </p>

              <section className="space-y-2 rounded-2xl border border-studio-border bg-studio-surface-alt p-3">
                <p className="text-xs font-semibold text-studio-text">
                  Templates ({selectedTemplateCount}/{maxTemplateCount})
                </p>
                {selectedTemplates.length ? (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedTemplates.map((template) => (
                      <span
                        key={template.id}
                        className="rounded-full border border-studio-border bg-studio-surface px-2 py-0.5 text-[11px] text-studio-text-muted"
                      >
                        {template.label}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-studio-text-muted">No templates selected.</p>
                )}
              </section>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onPress={() => setIsGenerateConfirmOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  onPress={handleConfirmGenerate}
                  isDisabled={!canContinue || isPending}
                >
                  Generate
                </Button>
              </div>
            </div>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </>
  );
}
