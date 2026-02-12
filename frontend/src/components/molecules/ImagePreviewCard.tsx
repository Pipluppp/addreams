import { Frame } from "../atoms/Frame";

type ImagePreviewCardProps = {
  src: string;
  alt: string;
  onSwap: () => void;
  onClear: () => void;
};

export function ImagePreviewCard({ src, alt, onSwap, onClear }: ImagePreviewCardProps) {
  return (
    <Frame className="space-y-3 p-3">
      <img
        src={src}
        alt={alt}
        width={1200}
        height={900}
        loading="lazy"
        decoding="async"
        className="h-48 w-full object-cover sm:h-56"
      />
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onSwap}
          className="border border-frame bg-surface px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-ink transition-colors duration-200 hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-frame focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
        >
          Swap image
        </button>
        <button
          type="button"
          onClick={onClear}
          className="border border-frame bg-surface px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-ink transition-colors duration-200 hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-frame focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
        >
          Clear
        </button>
      </div>
    </Frame>
  );
}
