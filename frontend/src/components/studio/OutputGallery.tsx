import { cn } from "../../lib/cn";
import { OutputTileActions } from "./OutputTileActions";

type OutputImage = {
  id: string;
  url: string;
  label: string;
};

type OutputGalleryProps = {
  images: OutputImage[];
  selectedId: string | null;
  onSelect: (imageId: string) => void;
  onEdit: (imageId: string) => void;
  onDownload: (imageId: string) => void;
  onRemove: (imageId: string) => void;
  disableActions?: boolean;
};

export function OutputGallery({
  images,
  selectedId,
  onSelect,
  onEdit,
  onDownload,
  onRemove,
  disableActions,
}: OutputGalleryProps) {
  if (images.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-studio-border bg-studio-surface-alt p-8 text-center text-sm text-studio-text-muted">
        No outputs available yet.
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {images.map((image) => {
        const isSelected = image.id === selectedId;
        return (
          <button
            key={image.id}
            type="button"
            onClick={() => onSelect(image.id)}
            className={cn(
              "group relative overflow-hidden rounded-2xl border bg-studio-surface text-left transition",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-studio-accent/70",
              isSelected ? "border-studio-accent" : "border-studio-border",
            )}
          >
            <img
              src={image.url}
              alt={image.label}
              width={1024}
              height={1024}
              className="h-64 w-full object-cover"
              loading="lazy"
              decoding="async"
            />
            <div className="flex items-center justify-between border-t border-studio-border bg-studio-surface px-3 py-2">
              <p className="text-xs text-studio-text-muted">{image.label}</p>
              {isSelected ? (
                <span className="rounded-full border border-studio-accent bg-studio-accent px-2 py-0.5 text-[10px] font-semibold text-studio-accent-contrast">
                  Selected
                </span>
              ) : null}
            </div>

            {isSelected ? (
              <div className="absolute inset-x-2 bottom-12 z-10">
                <OutputTileActions
                  onEdit={() => onEdit(image.id)}
                  onDownload={() => onDownload(image.id)}
                  onRemove={() => onRemove(image.id)}
                  disabled={disableActions}
                />
              </div>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
