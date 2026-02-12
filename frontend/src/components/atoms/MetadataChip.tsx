import type { ReactNode } from "react";

type MetadataChipProps = {
  label: string;
  value: ReactNode;
};

export function MetadataChip({ label, value }: MetadataChipProps) {
  return (
    <span className="inline-flex items-center gap-2 border border-frame px-3 py-1 text-xs text-ink">
      <span className="font-semibold uppercase tracking-[0.12em] text-muted">{label}</span>
      <span className="font-medium">{value}</span>
    </span>
  );
}
