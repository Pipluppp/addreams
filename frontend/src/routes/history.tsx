import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMolecule } from "bunshi/react";
import { Alert, Button, Card, Chip, Spinner } from "@heroui/react";
import type { HistoryItem } from "../lib/api";
import { ApiClientMolecule } from "../lib/dependencies";

const PAGE_SIZE = 12;

type HistoryFilters = {
  status?: "pending" | "succeeded" | "failed";
  workflow?: "image-from-text" | "image-from-reference" | "video-from-reference";
};

export default function HistoryRoute() {
  const api = useMolecule(ApiClientMolecule);
  const queryClient = useQueryClient();
  const [offset, setOffset] = useState(0);
  const [filters, setFilters] = useState<HistoryFilters>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const historyQuery = useQuery({
    queryKey: ["history", offset, filters.status, filters.workflow],
    queryFn: () =>
      api.listHistory({
        limit: PAGE_SIZE,
        offset,
        status: filters.status,
        workflow: filters.workflow,
      }),
  });

  const selectedSummary = useMemo(
    () => historyQuery.data?.items.find((item) => item.id === selectedId) ?? null,
    [historyQuery.data?.items, selectedId],
  );

  const detailQuery = useQuery({
    queryKey: ["history-detail", selectedId],
    queryFn: () => api.getHistory(selectedId!),
    enabled: !!selectedId,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteHistory(id),
    onSuccess: async (result) => {
      if (selectedId === result.id) {
        setSelectedId(null);
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["history"] }),
        queryClient.invalidateQueries({ queryKey: ["history-detail"] }),
      ]);
    },
  });

  const items = historyQuery.data?.items ?? [];
  const pagination = historyQuery.data?.pagination;

  return (
    <section className="container-shell py-6 sm:py-8">
      <div className="space-y-5">
        <header className="space-y-2">
          <h1 className="section-title text-ink">Generation History</h1>
          <p className="text-sm text-ink-soft">
            Review completed and failed runs, inspect payloads, and remove outdated items.
          </p>
        </header>

        <Card className="space-y-4 p-4 sm:p-5">
          <div className="flex flex-wrap gap-2">
            <FilterButton
              active={!filters.status}
              label="All statuses"
              onPress={() => {
                setOffset(0);
                setFilters((current) => ({ ...current, status: undefined }));
              }}
            />
            <FilterButton
              active={filters.status === "succeeded"}
              label="Succeeded"
              onPress={() => {
                setOffset(0);
                setFilters((current) => ({ ...current, status: "succeeded" }));
              }}
            />
            <FilterButton
              active={filters.status === "failed"}
              label="Failed"
              onPress={() => {
                setOffset(0);
                setFilters((current) => ({ ...current, status: "failed" }));
              }}
            />
            <FilterButton
              active={filters.status === "pending"}
              label="Pending"
              onPress={() => {
                setOffset(0);
                setFilters((current) => ({ ...current, status: "pending" }));
              }}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <FilterButton
              active={!filters.workflow}
              label="All workflows"
              onPress={() => {
                setOffset(0);
                setFilters((current) => ({ ...current, workflow: undefined }));
              }}
            />
            <FilterButton
              active={filters.workflow === "image-from-text"}
              label="Product Shoots"
              onPress={() => {
                setOffset(0);
                setFilters((current) => ({ ...current, workflow: "image-from-text" }));
              }}
            />
            <FilterButton
              active={filters.workflow === "image-from-reference"}
              label="Ad Graphics"
              onPress={() => {
                setOffset(0);
                setFilters((current) => ({ ...current, workflow: "image-from-reference" }));
              }}
            />
            <FilterButton
              active={filters.workflow === "video-from-reference"}
              label="Video Stub"
              onPress={() => {
                setOffset(0);
                setFilters((current) => ({ ...current, workflow: "video-from-reference" }));
              }}
            />
          </div>
        </Card>

        {historyQuery.isPending ? (
          <Card className="flex items-center justify-center gap-3 p-8 text-ink-soft">
            <Spinner />
            <span>Loading history…</span>
          </Card>
        ) : historyQuery.isError ? (
          <Alert status="danger">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>Unable to load history</Alert.Title>
              <Alert.Description>
                Please refresh and try again. If this keeps happening, check backend logs.
              </Alert.Description>
            </Alert.Content>
          </Alert>
        ) : items.length === 0 ? (
          <Card className="p-8 text-center text-sm text-ink-soft">
            No history entries yet for this filter.
          </Card>
        ) : (
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
            <Card className="space-y-3 p-4 sm:p-5">
              {items.map((item) => (
                <HistoryRow
                  key={item.id}
                  item={item}
                  isSelected={item.id === selectedId}
                  onSelect={() => setSelectedId(item.id)}
                  onDelete={() => {
                    if (!window.confirm("Delete this history item permanently?")) {
                      return;
                    }
                    deleteMutation.mutate(item.id);
                  }}
                  isDeleting={deleteMutation.isPending && deleteMutation.variables === item.id}
                />
              ))}
              <div className="flex items-center justify-between pt-2">
                <Button
                  variant="outline"
                  isDisabled={offset === 0 || historyQuery.isFetching}
                  onPress={() => setOffset((current) => Math.max(0, current - PAGE_SIZE))}
                >
                  Previous
                </Button>
                <p className="text-xs text-ink-muted">
                  {pagination ? `${pagination.offset + 1}-${pagination.offset + items.length} of ${pagination.total}` : "—"}
                </p>
                <Button
                  variant="outline"
                  isDisabled={!pagination?.nextOffset || historyQuery.isFetching}
                  onPress={() => setOffset(pagination?.nextOffset ?? offset)}
                >
                  Next
                </Button>
              </div>
            </Card>

            <Card className="space-y-4 p-4 sm:p-5">
              {!selectedId ? (
                <p className="text-sm text-ink-soft">Select a history item to inspect details.</p>
              ) : detailQuery.isPending ? (
                <div className="flex items-center gap-2 text-sm text-ink-soft">
                  <Spinner size="sm" />
                  <span>Loading details…</span>
                </div>
              ) : detailQuery.isError ? (
                <Alert status="danger">
                  <Alert.Indicator />
                  <Alert.Content>
                    <Alert.Title>Unable to load details</Alert.Title>
                    <Alert.Description>Try selecting the item again.</Alert.Description>
                  </Alert.Content>
                </Alert>
              ) : detailQuery.data?.item ? (
                <HistoryDetail item={detailQuery.data.item} />
              ) : (
                <p className="text-sm text-ink-soft">No detail data available for this item.</p>
              )}
            </Card>
          </div>
        )}
      </div>
    </section>
  );
}

function FilterButton({
  active,
  label,
  onPress,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Button variant={active ? "primary" : "outline"} size="sm" onPress={onPress}>
      {label}
    </Button>
  );
}

function HistoryRow({
  item,
  isSelected,
  onSelect,
  onDelete,
  isDeleting,
}: {
  item: HistoryItem;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}) {
  return (
    <article
      className={`space-y-3 rounded-xl border p-3 ${isSelected ? "border-accent bg-accent/5" : "border-ink-muted/20 bg-canvas"}`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Chip variant="soft" color={statusColor(item.status)}>
          {item.status}
        </Chip>
        <Chip variant="secondary">{toWorkflowLabel(item.workflow)}</Chip>
        <p className="text-xs text-ink-muted">{formatTimestamp(item.createdAt)}</p>
      </div>

      {item.assetUrl ? (
        <img
          src={item.assetUrl}
          alt="History result preview"
          width={800}
          height={800}
          loading="lazy"
          decoding="async"
          className="h-36 w-full rounded-lg bg-surface-alt object-cover"
        />
      ) : null}

      {item.errorMessage ? <p className="text-xs text-danger">{item.errorMessage}</p> : null}

      <div className="flex items-center gap-2">
        <Button size="sm" variant="outline" onPress={onSelect}>
          {isSelected ? "Viewing" : "View details"}
        </Button>
        <Button size="sm" variant="ghost" isPending={isDeleting} onPress={onDelete}>
          Delete
        </Button>
      </div>
    </article>
  );
}

function HistoryDetail({
  item,
}: {
  item: HistoryItem & {
    input: unknown;
    output: unknown;
  };
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <p className="text-xs uppercase tracking-[0.12em] text-ink-muted">Generation ID</p>
        <p className="text-xs text-ink">{item.id}</p>
      </div>
      {item.assetUrl ? (
        <img
          src={item.assetUrl}
          alt="History detail preview"
          width={1000}
          height={1000}
          loading="lazy"
          decoding="async"
          className="h-auto max-h-80 w-full rounded-xl bg-surface-alt object-contain"
        />
      ) : null}
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.12em] text-ink-muted">Input</p>
        <pre className="max-h-44 overflow-auto rounded-lg bg-canvas p-3 text-xs text-ink-soft">
          {JSON.stringify(item.input, null, 2)}
        </pre>
      </div>
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.12em] text-ink-muted">Output</p>
        <pre className="max-h-44 overflow-auto rounded-lg bg-canvas p-3 text-xs text-ink-soft">
          {JSON.stringify(item.output, null, 2)}
        </pre>
      </div>
    </div>
  );
}

function formatTimestamp(value: string | null): string {
  if (!value) {
    return "Unknown time";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString();
}

function toWorkflowLabel(workflow: HistoryItem["workflow"]): string {
  if (workflow === "image-from-text") return "Product Shoots";
  if (workflow === "image-from-reference") return "Ad Graphics";
  return "Video Stub";
}

function statusColor(
  status: HistoryItem["status"],
): "default" | "accent" | "success" | "warning" | "danger" {
  if (status === "succeeded") return "success";
  if (status === "failed") return "danger";
  if (status === "pending") return "warning";
  return "default";
}
