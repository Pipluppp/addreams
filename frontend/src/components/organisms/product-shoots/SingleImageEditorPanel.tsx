import { Button, Skeleton, Spinner } from "@heroui/react";
import { Download, Trash2 } from "lucide-react";
import type { ProductShootsOutputItem } from "../../../features/product-shoots/state";
import { TextareaField } from "../../atoms/TextareaField";
import { AspectRatioChipSelect } from "../../studio/AspectRatioChipSelect";

type AspectOption = {
  id: string;
  label: string;
};

type SingleImageEditorPanelProps = {
  sourceImageUrl: string | null;
  isSourceSelected: boolean;
  selectedTemplateLabels: string[];
  outputs: ProductShootsOutputItem[];
  selectedOutputId: string | null;
  editPrompt: string;
  aspectRatioId: string;
  aspectRatioOptions: AspectOption[];
  isPending: boolean;
  canGenerate: boolean;
  error: string | null;
  pendingIterationLabels: string[];
  onSelectSource: () => void;
  onSelectOutput: (imageId: string) => void;
  onEditPromptChange: (value: string) => void;
  onAspectRatioChange: (value: string) => void;
  onGenerate: () => void;
  onDownload: () => void;
  onDeleteSelected: () => void;
  canDeleteSelected: boolean;
};

export function SingleImageEditorPanel({
  sourceImageUrl,
  isSourceSelected,
  selectedTemplateLabels,
  outputs,
  selectedOutputId,
  editPrompt,
  aspectRatioId,
  aspectRatioOptions,
  isPending,
  canGenerate,
  error,
  pendingIterationLabels,
  onSelectSource,
  onSelectOutput,
  onEditPromptChange,
  onAspectRatioChange,
  onGenerate,
  onDownload,
  onDeleteSelected,
  canDeleteSelected,
}: SingleImageEditorPanelProps) {
  const selectedOutput = outputs.find((output) => output.id === selectedOutputId) ?? null;
  const selectedPreviewImage = isSourceSelected
    ? sourceImageUrl
    : (selectedOutput?.url ?? sourceImageUrl);
  const selectedPreviewLabel = isSourceSelected
    ? "Source product"
    : (selectedOutput?.label ?? "Generated output");

  return (
    <section className="space-y-4">
      <div className="grid gap-5 xl:grid-cols-[260px_1fr_320px]">
        <aside className="space-y-3">
          <h3 className="text-sm font-semibold text-studio-text">Source</h3>
          {sourceImageUrl ? (
            <div className="flex">
              <button
                type="button"
                onClick={onSelectSource}
                disabled={isPending}
                aria-label="Use source image for editing"
                className={`inline-block max-w-full overflow-hidden rounded-xl border bg-studio-surface text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-studio-accent/70 ${
                  isSourceSelected ? "border-studio-accent" : "border-studio-border"
                }`}
              >
                <img
                  src={sourceImageUrl}
                  alt="Source product"
                  width={640}
                  height={640}
                  className="block h-auto max-h-80 w-auto max-w-full object-contain"
                />
              </button>
            </div>
          ) : (
            <div className="grid aspect-square place-items-center rounded-xl border border-studio-border bg-studio-surface text-xs text-studio-text-muted">
              No source image
            </div>
          )}
          {selectedTemplateLabels.length ? (
            <div className="flex flex-wrap gap-1.5">
              {selectedTemplateLabels.map((label) => (
                <span
                  key={label}
                  className="rounded-full border border-studio-border bg-studio-surface px-2 py-0.5 text-[10px] text-studio-text-muted"
                >
                  {label}
                </span>
              ))}
            </div>
          ) : null}
        </aside>

        <section className="space-y-3">
          <div className="group relative overflow-hidden rounded-xl border border-studio-border bg-studio-surface-alt">
            {selectedPreviewImage ? (
              <img
                src={selectedPreviewImage}
                alt={selectedPreviewLabel}
                width={1400}
                height={1400}
                className="max-h-[68vh] w-full object-contain"
              />
            ) : (
              <div className="grid h-[460px] place-items-center text-sm text-studio-text-muted">
                {pendingIterationLabels.length > 0 ? (
                  <div className="flex items-center gap-2">
                    <Spinner size="sm" color="accent" />
                    <span>Generating template outputs...</span>
                  </div>
                ) : (
                  "Generate your first output."
                )}
              </div>
            )}

            {selectedPreviewImage && !isPending ? (
              <div className="pointer-events-none absolute right-3 top-3 flex items-center gap-2 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
                <button
                  type="button"
                  onClick={onDownload}
                  aria-label="Download selected image"
                  className="pointer-events-auto inline-flex size-8 items-center justify-center rounded-full border border-white/45 bg-black/50 text-white transition hover:bg-black/68 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-studio-accent/70"
                >
                  <Download className="size-4" aria-hidden="true" />
                </button>
                {canDeleteSelected ? (
                  <button
                    type="button"
                    onClick={onDeleteSelected}
                    aria-label="Delete selected image"
                    className="pointer-events-auto inline-flex size-8 items-center justify-center rounded-full border border-white/45 bg-black/50 text-white transition hover:bg-black/68 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-studio-accent/70"
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </button>
                ) : null}
              </div>
            ) : null}

            {isPending ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-studio-surface/70 backdrop-blur-sm">
                <Spinner size="lg" color="accent" />
                <p className="text-sm text-studio-text">Generating...</p>
              </div>
            ) : null}
          </div>
        </section>

        <aside className="space-y-3">
          <TextareaField
            id="single-image-edit-prompt"
            label="Prompt"
            value={editPrompt}
            onChange={(event) => onEditPromptChange(event.currentTarget.value)}
            rows={6}
            placeholder="Describe what to generate..."
          />

          <AspectRatioChipSelect
            value={aspectRatioId}
            options={aspectRatioOptions}
            onChange={onAspectRatioChange}
            isDisabled={isPending}
            className="w-full sm:w-full"
          />

          <Button
            type="button"
            variant="primary"
            onPress={onGenerate}
            isDisabled={!canGenerate}
            isPending={isPending}
          >
            Generate
          </Button>
        </aside>
      </div>

      {outputs.length || pendingIterationLabels.length ? (
        <section>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {pendingIterationLabels.map((label, index) => (
              <article
                key={`pending-${label}-${index}`}
                className="shrink-0 overflow-hidden rounded-xl border border-studio-border bg-studio-surface text-left"
                style={{ animationDelay: `${index * 120}ms` }}
              >
                <Skeleton className="size-30 rounded-none sm:size-32" />
                <div className="space-y-1 border-t border-studio-border bg-studio-surface px-2 py-1">
                  <p className="text-[11px] text-studio-text-muted">{label}</p>
                  <p className="text-[10px] text-studio-text-muted/75">Generating...</p>
                </div>
              </article>
            ))}

            {outputs.map((output, index) => {
              const isSelected = !isSourceSelected && selectedOutputId === output.id;
              return (
                <button
                  key={output.id}
                  type="button"
                  onClick={() => onSelectOutput(output.id)}
                  className={`shrink-0 overflow-hidden rounded-xl border text-left ${
                    isSelected ? "border-accent-primary" : "border-studio-border"
                  }`}
                  disabled={isPending}
                >
                  <img
                    src={output.url}
                    alt={output.label}
                    width={200}
                    height={200}
                    className="size-30 object-cover sm:size-32"
                  />
                  <span className="block border-t border-studio-border bg-studio-surface px-2 py-1 text-[11px] text-studio-text-muted">
                    {output.label || `Iteration ${index + 1}`}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      ) : null}

      {error ? (
        <p className="rounded-xl border border-red-400/40 bg-red-500/8 px-3 py-2 text-xs text-red-700">{error}</p>
      ) : null}
    </section>
  );
}
