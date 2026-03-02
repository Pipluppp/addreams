import { Button, Skeleton, Spinner } from "@heroui/react";
import type { ProductShootsOutputItem } from "../../../features/product-shoots/state";
import { TextareaField } from "../../atoms/TextareaField";
import { AspectRatioChipSelect } from "../../studio/AspectRatioChipSelect";

type AspectOption = {
  id: string;
  label: string;
};

type SingleImageEditorPanelProps = {
  sourceImageUrl: string | null;
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
  onSelectOutput: (imageId: string) => void;
  onEditPromptChange: (value: string) => void;
  onAspectRatioChange: (value: string) => void;
  onGenerate: () => void;
  onDownload: () => void;
};

export function SingleImageEditorPanel({
  sourceImageUrl,
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
  onSelectOutput,
  onEditPromptChange,
  onAspectRatioChange,
  onGenerate,
  onDownload,
}: SingleImageEditorPanelProps) {
  const selectedOutput = outputs.find((output) => output.id === selectedOutputId) ?? outputs[0] ?? null;

  return (
    <section className="space-y-4">
      <div className="grid gap-5 xl:grid-cols-[260px_1fr_320px]">
        <aside className="space-y-3">
          <h3 className="text-sm font-semibold text-studio-text">Source</h3>
          {sourceImageUrl ? (
            <div className="flex">
              <div className="inline-block max-w-full overflow-hidden rounded-xl border border-studio-border bg-studio-surface">
                <img
                  src={sourceImageUrl}
                  alt="Source product"
                  width={640}
                  height={640}
                  className="block h-auto max-h-80 w-auto max-w-full object-contain"
                />
              </div>
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
          <div className="relative overflow-hidden rounded-xl border border-studio-border bg-studio-surface-alt">
            {selectedOutput ? (
              <img
                src={selectedOutput.url}
                alt={selectedOutput.label}
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

            {isPending ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-studio-surface/70 backdrop-blur-sm">
                <Spinner size="lg" color="accent" />
                <p className="text-sm text-studio-text">Generating...</p>
              </div>
            ) : null}
          </div>

          {selectedOutput ? (
            <Button type="button" variant="ghost" onPress={onDownload} isDisabled={isPending}>
              Download Selected
            </Button>
          ) : null}
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
            {outputs.length ? "Generate Next" : "Generate"}
          </Button>

          {pendingIterationLabels.length > 0 ? (
            <div className="inline-flex items-center gap-2 rounded-full border border-studio-border bg-studio-surface px-3 py-1 text-xs text-studio-text-muted">
              <Spinner size="sm" color="accent" />
              <span>Building {pendingIterationLabels.length} template outputs...</span>
            </div>
          ) : null}
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
              const isSelected = selectedOutput?.id === output.id;
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
