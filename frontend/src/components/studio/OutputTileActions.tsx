import { Button } from "@heroui/react";

type OutputTileActionsProps = {
  onEdit: () => void;
  onDownload: () => void;
  onRemove: () => void;
  disabled?: boolean;
};

export function OutputTileActions({
  onEdit,
  onDownload,
  onRemove,
  disabled,
}: OutputTileActionsProps) {
  return (
    <div className="flex flex-wrap gap-2 rounded-xl border border-studio-border bg-studio-surface/90 p-2 backdrop-blur-sm">
      <Button type="button" variant="primary" size="sm" onPress={onEdit} isDisabled={disabled}>
        Edit
      </Button>
      <Button type="button" variant="ghost" size="sm" onPress={onDownload} isDisabled={disabled}>
        Download
      </Button>
      <Button type="button" variant="ghost" size="sm" onPress={onRemove} isDisabled={disabled}>
        Remove
      </Button>
    </div>
  );
}
