import type { WorkflowStubResponse } from "../../lib/api";
import { MetadataChip } from "../atoms/MetadataChip";

type ResultMetadataChipsProps = {
  response: WorkflowStubResponse;
};

export function ResultMetadataChips({ response }: ResultMetadataChipsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <MetadataChip label="Workflow" value={response.workflow} />
      <MetadataChip label="Request ID" value={response.requestId} />
      <MetadataChip label="Received" value={new Date(response.receivedAt).toLocaleString()} />
    </div>
  );
}
