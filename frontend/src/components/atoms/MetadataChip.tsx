import { Chip } from "@heroui/react";
import type { ReactNode } from "react";

type MetadataChipProps = {
  label: string;
  value: ReactNode;
};

export function MetadataChip({ label, value }: MetadataChipProps) {
  return (
    <Chip className="chip">
      <span className="accent-type mr-2 text-[10px] uppercase tracking-[0.15em] text-ink-muted">
        {label}
      </span>
      <span className="font-medium">{value}</span>
    </Chip>
  );
}
