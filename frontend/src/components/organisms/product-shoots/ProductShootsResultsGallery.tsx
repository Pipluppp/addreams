import { useMemo } from "react";
import { Button } from "@heroui/react";
import type { ProductShootsTemplate } from "../../../features/product-shoots/templates";
import { GenerationActionBar } from "../../studio/GenerationActionBar";
import { OutputGallery } from "../../studio/OutputGallery";
import { WorkflowContextPanel } from "../../studio/WorkflowContextPanel";
import type { ProductShootsOutputItem } from "../../../features/product-shoots/state";

type ProductShootsResultsGalleryProps = {
  outputs: ProductShootsOutputItem[];
  selectedOutputId: string | null;
  contextImageUrl: string | null;
  selectedTemplateLabels: string[];
  selectedTemplates: ProductShootsTemplate[];
  prompt: string;
  disableActions?: boolean;
  onSelectOutput: (imageId: string) => void;
  onEditOutput: (imageId: string) => void;
  onDownloadOutput: (imageId: string) => void;
  onRemoveOutput: (imageId: string) => void;
  onCreateCampaign: () => void;
  onAddAll: () => void;
  onDownloadAll: () => void;
  onContinueGenerating: () => void;
};

export function ProductShootsResultsGallery({
  outputs,
  selectedOutputId,
  contextImageUrl,
  selectedTemplateLabels,
  selectedTemplates,
  prompt,
  disableActions,
  onSelectOutput,
  onEditOutput,
  onDownloadOutput,
  onRemoveOutput,
  onCreateCampaign,
  onAddAll,
  onDownloadAll,
  onContinueGenerating,
}: ProductShootsResultsGalleryProps) {
  const galleryItems = useMemo(
    () => outputs.map((output, index) => ({ ...output, label: output.label || `Output ${index + 1}` })),
    [outputs],
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button type="button" variant="secondary" onPress={onContinueGenerating}>
          Continue Generating
        </Button>
      </div>
      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <WorkflowContextPanel
          title="Guided generation context"
          subtitle="Your product image and selected templates remain pinned while reviewing outputs."
          imageUrl={contextImageUrl}
          promptSummary={prompt || undefined}
          templateLabels={selectedTemplateLabels}
        />
        <OutputGallery
          images={galleryItems}
          selectedId={selectedOutputId}
          onSelect={onSelectOutput}
          onEdit={onEditOutput}
          onDownload={onDownloadOutput}
          onRemove={onRemoveOutput}
          disableActions={disableActions}
        />
      </div>

      {selectedTemplates.length ? (
        <section className="space-y-2 rounded-2xl border border-studio-border bg-studio-surface p-3">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-sm font-semibold text-studio-text">Template Inspirations</h4>
            <p className="text-xs text-studio-text-muted">Placeholder references</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {selectedTemplates.map((template) => (
              <article key={template.id} className="overflow-hidden rounded-xl border border-studio-border bg-studio-surface-alt">
                <div
                  className="h-30"
                  style={{
                    backgroundImage: `linear-gradient(145deg, ${template.preview.gradientFrom}, ${template.preview.gradientTo})`,
                  }}
                />
                <div className="space-y-1 px-2.5 py-2">
                  <p className="text-xs font-semibold text-studio-text">{template.label}</p>
                  <p className="text-[11px] text-studio-text-muted">{template.preview.toneLabel}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <GenerationActionBar
        onCreateCampaign={onCreateCampaign}
        onAddAll={onAddAll}
        onDownloadAll={onDownloadAll}
        disabled={disableActions || outputs.length === 0}
      />
    </div>
  );
}
