import type { ReactNode } from "react";
import { Button, Card } from "@heroui/react";
import { FrameCanvas } from "../atoms/FrameCanvas";

type ResultPanelProps = {
  isPending: boolean;
  error: string | null;
  isEmpty: boolean;
  emptyLabel: string;
  loadingLabel: string;
  successContent: ReactNode;
  onIterate?: () => void;
  iterateLabel?: string;
};

export function ResultPanel({
  isPending,
  error,
  isEmpty,
  emptyLabel,
  loadingLabel,
  successContent,
  onIterate,
  iterateLabel = "Iterate",
}: ResultPanelProps) {
  if (isPending) {
    return (
      <div aria-live="polite">
        <FrameCanvas label={loadingLabel} />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-4">
        <p className="text-sm font-medium text-error" role="alert">
          {error}
        </p>
      </Card>
    );
  }

  if (isEmpty) {
    return (
      <div aria-live="polite">
        <FrameCanvas label={emptyLabel} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {successContent}
      {onIterate ? (
        <Button type="button" variant="secondary" onPress={onIterate}>
          {iterateLabel}
        </Button>
      ) : null}
    </div>
  );
}
