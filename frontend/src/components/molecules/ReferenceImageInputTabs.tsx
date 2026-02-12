import { cn } from "../../lib/cn";
import type { ReferenceMode } from "../../features/ad-graphics/schema";

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
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={value === tab.id}
          className={cn(
            "flex-1 border px-4 py-2 text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-frame focus-visible:ring-offset-2 focus-visible:ring-offset-canvas",
            value === tab.id
              ? "rounded-pill border-accent bg-accent text-accent-ink"
              : "border-frame bg-surface text-ink hover:border-accent",
          )}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
