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
      <div className="flex max-h-[65vh] min-h-52 w-full items-center justify-center overflow-hidden rounded-xl bg-canvas p-2 sm:min-h-60 sm:max-h-[32rem]">
        <img
          src={src}
          alt={alt}
          width={1200}
          height={900}
          loading="lazy"
          decoding="async"
          className="h-auto max-h-[60vh] w-full object-contain sm:max-h-[30rem]"
        />
      </div>
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
