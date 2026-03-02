import { Chip } from "@heroui/react";

type SelectionCounterChipProps = {
  selectedCount: number;
  maxCount: number;
};

export function SelectionCounterChip({ selectedCount, maxCount }: SelectionCounterChipProps) {
  const isAtCap = selectedCount >= maxCount;

  return (
    <Chip
      variant="secondary"
      color={isAtCap ? "accent" : "default"}
      className="bg-studio-surface-alt text-xs text-studio-text"
    >
      {selectedCount}/{maxCount} selected
    </Chip>
  );
}
