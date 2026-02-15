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
        aria-label="Upload reference image"
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
          "flex min-h-40 flex-col items-center justify-center gap-2 rounded-lg px-4 py-6 text-center",
          isActive ? "bg-accent-highlight-soft" : "bg-surface-alt",
          error && "bg-[color-mix(in_srgb,var(--color-error)_8%,var(--color-surface-alt))]",
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
        <p className="text-xs text-ink-muted">JPG, PNG, BMP, WEBP, TIFF, GIF up to 10MB</p>
        <button
          id={buttonId}
          type="button"
          onClick={openFileDialog}
          className="mt-1 rounded-xl bg-surface px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-ink transition-colors duration-200 hover:bg-accent-highlight-soft hover:text-accent-primary"
        >
          Choose file
        </button>
      </div>
      {error ? <p className="text-xs text-error" role="alert">{error}</p> : null}
    </div>
  );
}
