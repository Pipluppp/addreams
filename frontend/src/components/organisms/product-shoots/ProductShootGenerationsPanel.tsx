import { Spinner } from "@heroui/react";
import type { ProductShootRun } from "../../../lib/api";

type ProductShootGenerationsPanelProps = {
  items: ProductShootRun[];
  isLoading: boolean;
  isError: boolean;
  openingRunId: string | null;
  onOpenRun: (runId: string) => void;
};

export function ProductShootGenerationsPanel({
  items,
  isLoading,
  isError,
  openingRunId,
  onOpenRun,
}: ProductShootGenerationsPanelProps) {
  return (
    <section className="space-y-2">
      <p className="accent-type text-[10px] uppercase tracking-[0.16em] text-studio-text-muted">
        Generations
      </p>

      {isLoading ? (
        <div className="flex items-center gap-2 rounded-xl border border-studio-border bg-studio-surface px-3 py-3 text-sm text-studio-text-muted">
          <Spinner size="sm" color="accent" />
          <span>Loading previous generations...</span>
        </div>
      ) : null}

      {isError ? (
        <p className="rounded-xl border border-red-400/40 bg-red-500/8 px-3 py-2 text-sm text-red-700">
          Could not load generations.
        </p>
      ) : null}

      {!isLoading && !isError && items.length === 0 ? (
        <p className="rounded-xl border border-studio-border bg-studio-surface-alt px-3 py-2 text-sm text-studio-text-muted">
          No saved generations yet.
        </p>
      ) : null}

      {!isLoading && !isError && items.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {items.map((item) => {
            const isOpening = openingRunId === item.runId;
            const previewOutputs = item.outputs.filter((output) => Boolean(output.imageUrl)).slice(0, 8);
            return (
              <button
                key={item.runId}
                type="button"
                onClick={() => onOpenRun(item.runId)}
                disabled={isOpening}
                className="group relative inline-flex w-fit max-w-full rounded-xl border border-studio-border bg-studio-surface p-1.5 text-left transition hover:border-studio-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-studio-accent/70 disabled:opacity-70"
                aria-label="Open saved generation"
              >
                <div className="flex items-start gap-2">
                  <ThumbnailTile
                    imageUrl={item.sourceImageUrl}
                    alt="Source product"
                    isSource
                    sizeClass="size-[62px] sm:size-[68px]"
                  />

                  <div className="flex flex-wrap gap-1 sm:gap-1.5">
                    {previewOutputs.map((output) => (
                      <ThumbnailTile
                        key={output.generationId}
                        imageUrl={output.imageUrl}
                        alt={output.templateLabel}
                        sizeClass="size-[34px] sm:size-[38px]"
                      />
                    ))}
                  </div>
                </div>

                {isOpening ? (
                  <span className="pointer-events-none absolute right-2 top-2 inline-flex size-6 items-center justify-center rounded-full bg-studio-surface/90 text-studio-text-muted">
                    <Spinner size="sm" color="accent" />
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}

function ThumbnailTile({
  imageUrl,
  alt,
  isSource = false,
  sizeClass = "size-9",
}: {
  imageUrl: string | null;
  alt: string;
  isSource?: boolean;
  sizeClass?: string;
}) {
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={alt}
        width={96}
        height={96}
        loading="lazy"
        decoding="async"
        className={`${sizeClass} rounded-md object-cover ${
          isSource ? "border-2 border-studio-accent/70" : "border border-studio-border"
        }`}
      />
    );
  }

  return (
    <div
      aria-hidden="true"
      className={`${sizeClass} rounded-md border border-studio-border ${
        isSource ? "bg-studio-surface-alt" : "bg-studio-surface-alt/55"
      }`}
    />
  );
}
