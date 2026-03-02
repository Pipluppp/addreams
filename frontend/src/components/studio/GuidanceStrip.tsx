import { Card } from "@heroui/react";

type GuidanceStripProps = {
  items: string[];
};

export function GuidanceStrip({ items }: GuidanceStripProps) {
  return (
    <Card className="border border-studio-border bg-studio-surface-alt p-3">
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <span
            key={item}
            className="rounded-full border border-studio-border bg-studio-surface px-2.5 py-1 text-[11px] text-studio-text-muted"
          >
            {item}
          </span>
        ))}
      </div>
    </Card>
  );
}
