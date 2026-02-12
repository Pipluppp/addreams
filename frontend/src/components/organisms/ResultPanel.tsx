import type { ReactNode } from "react";
import { FrameCanvas } from "../atoms/FrameCanvas";
import { Frame } from "../atoms/Frame";
import { PillButton } from "../atoms/PillButton";

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
      <Frame className="p-4">
        <p className="text-sm font-medium text-error" role="alert">
          {error}
        </p>
      </Frame>
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
        <PillButton type="button" tone="secondary" onClick={onIterate}>
          {iterateLabel}
        </PillButton>
      ) : null}
    </div>
  );
}
