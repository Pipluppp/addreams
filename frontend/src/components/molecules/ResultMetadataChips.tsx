import {
  isWorkflowCompletedResponse,
  type WorkflowResponse,
} from "../../lib/api";
import { MetadataChip } from "../atoms/MetadataChip";

type ResultMetadataChipsProps = {
  response: WorkflowResponse;
};

export function ResultMetadataChips({ response }: ResultMetadataChipsProps) {
  if (!isWorkflowCompletedResponse(response)) {
    return (
      <div className="flex flex-wrap gap-2">
        <MetadataChip label="Workflow" value={response.workflow} />
        <MetadataChip label="Request ID" value={response.requestId} />
        <MetadataChip label="Status" value={response.status} />
        {response.receivedAt ? (
          <MetadataChip label="Received" value={new Date(response.receivedAt).toLocaleString()} />
        ) : null}
      </div>
    );
  }

  const usageValue = response.usage
    ? [
        typeof response.usage.imageCount === "number" ? `n=${response.usage.imageCount}` : null,
        typeof response.usage.width === "number" ? `w=${response.usage.width}` : null,
        typeof response.usage.height === "number" ? `h=${response.usage.height}` : null,
      ]
        .filter(Boolean)
        .join(" ")
    : null;

  return (
    <div className="flex flex-wrap gap-2">
      <MetadataChip label="Workflow" value={response.workflow} />
      <MetadataChip label="Request ID" value={response.requestId} />
      <MetadataChip label="Provider" value={response.provider.name} />
      <MetadataChip label="Provider ID" value={response.provider.requestId ?? "n/a"} />
      <MetadataChip label="Model" value={response.provider.model} />
      <MetadataChip label="URL TTL" value={`${response.output.expiresInHours}h`} />
      {usageValue ? <MetadataChip label="Usage" value={usageValue} /> : null}
    </div>
  );
}
