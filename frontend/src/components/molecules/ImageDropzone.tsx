import { useId, useRef, useState } from "react";
import { cn } from "../../lib/cn";

type ImageDropzoneProps = {
  onFileSelected: (file: File) => void;
  error?: string;
  buttonId?: string;
};

export function ImageDropzone({ onFileSelected, error, buttonId }: ImageDropzoneProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isActive, setIsActive] = useState(false);

  function openFileDialog() {
    inputRef.current?.click();
  }

  return (
    <div className="space-y-2">
      <input
        id={inputId}
        ref={inputRef}
        type="file"
        className="sr-only"
        accept="image/jpeg,image/png,image/bmp,image/webp,image/tiff,image/gif"
        onChange={(event) => {
          const next = event.target.files?.[0];
          if (next) {
            onFileSelected(next);
          }
          event.currentTarget.value = "";
        }}
      />
      <div
        className={cn(
          "flex min-h-40 flex-col items-center justify-center gap-2 border border-dashed px-4 py-6 text-center",
          isActive ? "border-accent bg-surface-soft" : "border-frame bg-surface",
          error ? "border-error" : "",
        )}
        onDragOver={(event) => {
          event.preventDefault();
          setIsActive(true);
        }}
        onDragLeave={() => setIsActive(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsActive(false);
          const next = event.dataTransfer.files?.[0];
          if (next) {
            onFileSelected(next);
          }
        }}
      >
        <p className="text-sm font-medium text-ink">Drop an image here</p>
        <p className="text-xs text-muted">JPG, PNG, BMP, WEBP, TIFF, GIF up to 10MB</p>
        <button
          id={buttonId}
          type="button"
          onClick={openFileDialog}
          className="mt-1 border border-frame bg-surface px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-ink transition-colors duration-200 hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-frame focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
        >
          Choose file
        </button>
      </div>
      {error ? <p className="text-xs text-error">{error}</p> : null}
    </div>
  );
}
