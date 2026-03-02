import { cn } from "../../lib/cn";

type TemplateTileProps = {
  id: string;
  label: string;
  summary: string;
  preview: {
    toneLabel: string;
    gradientFrom: string;
    gradientTo: string;
  };
  isSelected: boolean;
  isDisabled: boolean;
  onPress: (templateId: string) => void;
};

export function TemplateTile({
  id,
  label,
  summary,
  preview,
  isSelected,
  isDisabled,
  onPress,
}: TemplateTileProps) {
  return (
    <button
      type="button"
      onClick={() => onPress(id)}
      disabled={isDisabled}
      className={cn(
        "group relative rounded-2xl border p-3 text-left transition",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-studio-accent/70",
        isSelected
          ? "border-studio-accent bg-studio-surface text-studio-text"
          : "border-studio-border bg-studio-surface-alt text-studio-text",
        isDisabled && "cursor-not-allowed opacity-45",
      )}
      aria-pressed={isSelected}
    >
      <div
        className="relative mb-3 h-30 w-full overflow-hidden rounded-xl border border-studio-border"
        style={{
          backgroundImage: `linear-gradient(135deg, ${preview.gradientFrom}, ${preview.gradientTo})`,
        }}
      >
        <div className="absolute left-2 top-2 rounded-full bg-white/75 px-2 py-0.5 text-[10px] font-semibold text-ink">
          {preview.toneLabel}
        </div>
        <div className="absolute inset-x-4 bottom-3 rounded-lg border border-white/60 bg-white/55 p-2 text-[10px] font-medium text-ink">
          Placeholder template preview
        </div>
      </div>

      <div className="space-y-1">
        <p className="text-sm font-semibold">{label}</p>
        <p className="text-xs text-studio-text-muted">{summary}</p>
      </div>
      {isSelected ? (
        <span className="absolute right-3 top-3 inline-flex size-5 items-center justify-center rounded-full border border-studio-accent bg-studio-accent text-[10px] font-semibold text-studio-accent-contrast">
          ON
        </span>
      ) : null}
    </button>
  );
}
