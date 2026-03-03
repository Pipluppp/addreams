import { useId, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { cn } from "../../lib/cn";

type ImageDropzoneProps = {
  onFileSelected: (file: File) => void;
  error?: string;
  buttonId?: string;
  panelClassName?: string;
};

export function ImageDropzone({ onFileSelected, error, buttonId, panelClassName }: ImageDropzoneProps) {
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
        id={buttonId}
        role="button"
        tabIndex={0}
        aria-label="Upload reference image"
        className={cn(
          "flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-lg px-4 py-6 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
          isActive ? "bg-accent-highlight-soft" : "bg-surface-alt",
          error && "bg-[color-mix(in_srgb,var(--color-error)_8%,var(--color-surface-alt))]",
          panelClassName,
        )}
        onClick={openFileDialog}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openFileDialog();
          }
        }}
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
        <span className="inline-flex size-12 items-center justify-center rounded-full border border-studio-border bg-studio-surface text-studio-text shadow-sm">
          <Plus className="size-6" aria-hidden="true" />
        </span>
      </div>
      {error ? <p className="text-xs text-error" role="alert">{error}</p> : null}
    </div>
  );
}
