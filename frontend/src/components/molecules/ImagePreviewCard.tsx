import { Button, Card } from "@heroui/react";

type ImagePreviewCardProps = {
  src: string;
  alt: string;
  onSwap: () => void;
  onClear: () => void;
};

export function ImagePreviewCard({ src, alt, onSwap, onClear }: ImagePreviewCardProps) {
  return (
    <Card className="space-y-3 p-3">
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
        <Button type="button" variant="ghost" onPress={onSwap} className="px-3 py-1 text-xs">
          Swap image
        </Button>
        <Button type="button" variant="ghost" onPress={onClear} className="px-3 py-1 text-xs">
          Clear
        </Button>
      </div>
    </Card>
  );
}
