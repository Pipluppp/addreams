import { Button, Card } from "@heroui/react";

type GenerationActionBarProps = {
  onCreateCampaign: () => void;
  onAddAll: () => void;
  onDownloadAll: () => void;
  disabled?: boolean;
};

export function GenerationActionBar({
  onCreateCampaign,
  onAddAll,
  onDownloadAll,
  disabled,
}: GenerationActionBarProps) {
  return (
    <Card className="border border-studio-border bg-studio-surface p-3">
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="primary" onPress={onCreateCampaign} isDisabled={disabled}>
          Create Campaign
        </Button>
        <Button type="button" variant="secondary" onPress={onAddAll} isDisabled={disabled}>
          Add all to Business DNA
        </Button>
        <Button type="button" variant="ghost" onPress={onDownloadAll} isDisabled={disabled}>
          Download
        </Button>
      </div>
    </Card>
  );
}
