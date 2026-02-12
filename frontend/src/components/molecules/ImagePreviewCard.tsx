import { Frame } from "../atoms/Frame";
import { PillButton } from "../atoms/PillButton";

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
        <PillButton type="button" tone="neutral" onClick={onSwap} className="px-3 py-1 text-xs">
          Swap image
        </PillButton>
        <PillButton type="button" tone="neutral" onClick={onClear} className="px-3 py-1 text-xs">
          Clear
        </PillButton>
      </div>
    </Frame>
  );
}
