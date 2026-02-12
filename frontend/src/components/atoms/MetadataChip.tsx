import type { ReactNode } from "react";
import { SquircleSurface } from "./SquircleSurface";

type MetadataChipProps = {
  label: string;
  value: ReactNode;
};

export function MetadataChip({ label, value }: MetadataChipProps) {
  return (
    <SquircleSurface
      asChild
      radius="xl"
      smooth="lg"
      className="inline-flex items-center gap-2 bg-surface px-3 py-1.5 text-xs text-ink"
    >
      <span>
        <span className="accent-type mr-2 text-[10px] uppercase tracking-[0.15em] text-ink-muted">
          {label}
        </span>
        <span className="font-medium">{value}</span>
      </span>
    </SquircleSurface>
  );
}
