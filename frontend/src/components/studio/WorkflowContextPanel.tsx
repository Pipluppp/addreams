import { Card, Chip } from "@heroui/react";

type WorkflowContextPanelProps = {
  title: string;
  subtitle?: string;
  imageUrl?: string | null;
  promptSummary?: string;
  templateLabels?: string[];
};

export function WorkflowContextPanel({
  title,
  subtitle,
  imageUrl,
  promptSummary,
  templateLabels,
}: WorkflowContextPanelProps) {
  return (
    <Card className="space-y-4 border border-studio-border bg-studio-surface-alt p-4">
      <div className="space-y-1">
        <p className="accent-type text-[10px] uppercase tracking-[0.16em] text-studio-text-muted">
          Context
        </p>
        <h3 className="text-sm font-semibold text-studio-text">{title}</h3>
        {subtitle ? <p className="text-xs text-studio-text-muted">{subtitle}</p> : null}
      </div>

      {imageUrl ? (
        <div className="overflow-hidden rounded-xl border border-studio-border bg-studio-surface">
          <img
            src={imageUrl}
            alt="Reference"
            width={512}
            height={512}
            className="h-40 w-full object-cover"
          />
        </div>
      ) : null}

      {templateLabels?.length ? (
        <div className="flex flex-wrap gap-2">
          {templateLabels.map((label) => (
            <Chip key={label} size="sm" variant="secondary" className="bg-studio-surface text-studio-text">
              {label}
            </Chip>
          ))}
        </div>
      ) : null}

      {promptSummary ? (
        <p className="rounded-xl border border-studio-border bg-studio-surface px-3 py-2 text-xs text-studio-text-muted">
          {promptSummary}
        </p>
      ) : null}
    </Card>
  );
}
