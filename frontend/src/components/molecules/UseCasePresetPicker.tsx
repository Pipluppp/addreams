import { ScrollShadow } from "@heroui/react";
import { cn } from "../../lib/cn";
import type { UseCasePreset } from "../../features/ad-graphics/presets";

type UseCasePresetPickerProps = {
  presets: readonly UseCasePreset[];
  selectedPresetId: string;
  onSelect: (preset: UseCasePreset) => void;
};

export function UseCasePresetPicker({
  presets,
  selectedPresetId,
  onSelect,
}: UseCasePresetPickerProps) {
  return (
    <ScrollShadow orientation="horizontal" className="-mx-1 px-1">
      <div className="flex gap-2 pb-1">
        {presets.map((preset) => {
          const isActive = preset.id === selectedPresetId;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onSelect(preset)}
              className={cn(
                "shrink-0 cursor-pointer rounded-lg border px-3 py-2 text-left transition-colors",
                isActive
                  ? "border-accent bg-accent/10 text-ink"
                  : "border-transparent bg-surface-alt text-ink-soft hover:bg-surface-alt/80",
              )}
            >
              <p className="text-xs font-medium">{preset.label}</p>
              <p className="mt-0.5 text-[10px] text-ink-muted">{preset.description}</p>
            </button>
          );
        })}
      </div>
    </ScrollShadow>
  );
}
