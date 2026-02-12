import { Frame } from "../atoms/Frame";
import { ValidationSummary } from "../molecules/ValidationSummary";

type WorkflowReviewPanelProps = {
  payload: unknown;
  checks: Array<{ label: string; valid: boolean }>;
  note?: string;
};

export function WorkflowReviewPanel({ payload, checks, note }: WorkflowReviewPanelProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
      <Frame className="space-y-3 p-4">
        <h3 className="text-sm font-semibold text-ink">Payload Preview</h3>
        <pre className="max-h-80 overflow-auto bg-surface-alt p-3 text-xs text-ink-soft">
          {JSON.stringify(payload, null, 2)}
        </pre>
        {note ? <p className="text-xs text-ink-muted">{note}</p> : null}
      </Frame>
      <ValidationSummary checks={checks} />
    </div>
  );
}
