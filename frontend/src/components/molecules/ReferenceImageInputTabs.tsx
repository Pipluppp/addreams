import { cn } from "../../lib/cn";
import type { ReferenceMode } from "../../features/ad-graphics/schema";
import { SquircleSurface } from "../atoms/SquircleSurface";

type ReferenceImageInputTabsProps = {
  value: ReferenceMode;
  onChange: (mode: ReferenceMode) => void;
};

export function ReferenceImageInputTabs({ value, onChange }: ReferenceImageInputTabsProps) {
  const tabs: Array<{ id: ReferenceMode; label: string }> = [
    { id: "upload", label: "Upload" },
    { id: "url", label: "URL" },
  ];

  return (
    <div className="flex w-full gap-2" role="tablist" aria-label="Reference image source">
      {tabs.map((tab) => (
        <SquircleSurface key={tab.id} asChild radius="xl" smooth="lg">
          <button
            type="button"
            role="tab"
            aria-selected={value === tab.id}
            className={cn(
              "flex-1 px-4 py-2 text-sm font-medium transition-colors duration-200",
              value === tab.id
                ? "bg-accent-primary text-on-primary"
                : "bg-surface text-ink-soft hover:bg-surface-alt hover:text-accent-primary",
            )}
            onClick={() => onChange(tab.id)}
          >
            {tab.label}
          </button>
        </SquircleSurface>
      ))}
    </div>
  );
}
