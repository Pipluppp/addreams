# 06 — Frontend History: Generation History UI

## Overview

A new `/history` page that displays the user's past image generations as a browsable gallery, with filtering and detail views.

## Data Fetching

### `frontend/src/features/history/queries.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface Generation {
  id: string;
  workflow: "product-shoots" | "ad-graphics";
  prompt: string;
  negativePrompt: string | null;
  size: string | null;
  status: "pending" | "completed" | "failed";
  images: { url: string }[];
  errorMessage: string | null;
  createdAt: string;
  completedAt: string | null;
}

interface GenerationsResponse {
  data: Generation[];
  page: number;
  limit: number;
}

export function useGenerations(params?: {
  page?: number;
  workflow?: string;
}) {
  const page = params?.page ?? 1;
  const workflow = params?.workflow;

  const searchParams = new URLSearchParams();
  searchParams.set("page", String(page));
  if (workflow) searchParams.set("workflow", workflow);

  return useQuery<GenerationsResponse>({
    queryKey: ["generations", { page, workflow }],
    queryFn: () =>
      fetch(`/api/generations?${searchParams}`, { credentials: "include" })
        .then((r) => {
          if (!r.ok) throw new Error("Failed to fetch generations");
          return r.json();
        }),
  });
}

export function useGeneration(id: string) {
  return useQuery<Generation>({
    queryKey: ["generations", id],
    queryFn: () =>
      fetch(`/api/generations/${id}`, { credentials: "include" })
        .then((r) => {
          if (!r.ok) throw new Error("Failed to fetch generation");
          return r.json();
        }),
    enabled: !!id,
  });
}

export function useDeleteGeneration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/generations/${id}`, {
        method: "DELETE",
        credentials: "include",
      }).then((r) => {
        if (!r.ok) throw new Error("Failed to delete generation");
        return r.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["generations"] });
    },
  });
}
```

## History Page

### `frontend/src/pages/history.tsx`

```typescript
import { useState } from "react";
import { RequireAuth } from "@/components/auth/require-auth";
import { useGenerations } from "@/features/history/queries";
import { GenerationGrid } from "@/features/history/components/generation-grid";
import { Tabs, Spinner } from "@heroui/react";

export default function HistoryPage() {
  const [workflow, setWorkflow] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const { data, isPending, isError } = useGenerations({ page, workflow });

  return (
    <RequireAuth>
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <h1 className="text-2xl font-semibold">Generation History</h1>

        {/* Workflow filter tabs */}
        <Tabs
          selectedKey={workflow ?? "all"}
          onSelectionChange={(key) => {
            setWorkflow(key === "all" ? undefined : String(key));
            setPage(1);
          }}
        >
          <Tabs.Item key="all" title="All" />
          <Tabs.Item key="product-shoots" title="Product Shoots" />
          <Tabs.Item key="ad-graphics" title="Ad Graphics" />
        </Tabs>

        {/* Content */}
        {isPending ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : isError ? (
          <p className="text-red-500">Failed to load generation history.</p>
        ) : data?.data.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <GenerationGrid generations={data.data} />
            <Pagination page={page} onPageChange={setPage} />
          </>
        )}
      </div>
    </RequireAuth>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-16">
      <p className="text-lg text-muted">No generations yet.</p>
      <p className="text-sm text-muted mt-2">
        Create your first image from Product Shoots or Ad Graphics.
      </p>
    </div>
  );
}
```

## Generation Grid

### `frontend/src/features/history/components/generation-grid.tsx`

A responsive image grid showing generation thumbnails with metadata:

```typescript
import { Card, Chip } from "@heroui/react";
import { Link } from "react-router-dom";

interface Props {
  generations: Generation[];
}

export function GenerationGrid({ generations }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {generations.map((gen) => (
        <GenerationCard key={gen.id} generation={gen} />
      ))}
    </div>
  );
}

function GenerationCard({ generation }: { generation: Generation }) {
  const firstImage = generation.images[0]?.url;
  const isCompleted = generation.status === "completed";
  const isFailed = generation.status === "failed";

  return (
    <Card className="overflow-hidden group">
      {/* Image thumbnail */}
      <div className="aspect-square bg-muted relative">
        {firstImage && isCompleted ? (
          <img
            src={firstImage}
            alt={generation.prompt}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : isFailed ? (
          <div className="flex items-center justify-center h-full text-red-500">
            Failed
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <Spinner />
          </div>
        )}

        {/* Hover overlay with quick actions */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
          <p className="text-white text-sm line-clamp-2">{generation.prompt}</p>
        </div>
      </div>

      {/* Metadata */}
      <div className="p-3 space-y-1">
        <div className="flex items-center gap-2">
          <Chip size="sm" variant={generation.workflow === "product-shoots" ? "solid" : "outline"}>
            {generation.workflow === "product-shoots" ? "Product Shoots" : "Ad Graphics"}
          </Chip>
          {generation.images.length > 1 && (
            <span className="text-xs text-muted">{generation.images.length} images</span>
          )}
        </div>
        <p className="text-xs text-muted">
          {new Date(generation.createdAt).toLocaleDateString()}
        </p>
      </div>
    </Card>
  );
}
```

## Generation Detail View (Optional Modal or Page)

Could be implemented as:
1. **Modal overlay** — Click a card, see full-size images in a modal
2. **Dedicated page** — `/history/:id` route with full details

Recommendation: Start with a modal for quick previews, add dedicated page later if needed.

### Modal approach:

```typescript
import { Modal, Button } from "@heroui/react";
import { useGeneration, useDeleteGeneration } from "@/features/history/queries";

function GenerationDetailModal({ id, isOpen, onClose }) {
  const { data: generation } = useGeneration(id);
  const deleteGen = useDeleteGeneration();

  if (!generation) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="3xl">
      <Modal.Header>
        <h2>Generation Details</h2>
      </Modal.Header>
      <Modal.Body>
        {/* Full-size image carousel */}
        <div className="space-y-4">
          {generation.images.map((img, i) => (
            <img key={i} src={img.url} alt={`Output ${i + 1}`} className="w-full rounded" />
          ))}
        </div>

        {/* Details */}
        <div className="mt-4 space-y-2">
          <p><strong>Prompt:</strong> {generation.prompt}</p>
          {generation.negativePrompt && (
            <p><strong>Negative Prompt:</strong> {generation.negativePrompt}</p>
          )}
          <p><strong>Size:</strong> {generation.size}</p>
          <p><strong>Created:</strong> {new Date(generation.createdAt).toLocaleString()}</p>
        </div>
      </Modal.Body>
      <Modal.Footer>
        {/* Download button */}
        {generation.images.map((img, i) => (
          <Button key={i} as="a" href={img.url} download variant="outline" size="sm">
            Download {generation.images.length > 1 ? `#${i + 1}` : ""}
          </Button>
        ))}
        {/* Delete */}
        <Button
          variant="outline"
          color="danger"
          onPress={() => {
            deleteGen.mutate(generation.id);
            onClose();
          }}
        >
          Delete
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
```

## Integration with Workflow Pages

After a successful generation, link the user to their history:

```typescript
// In ProductShootsForm or AdGraphicsPanel, after mutation succeeds:
const mutation = useProductShootsMutation();

// On success callback:
onSuccess: (data) => {
  // Show success + link to history
  toast({
    title: "Image generated!",
    action: <Link to={`/history`}>View in History</Link>,
  });
}
```

## Optimistic Updates

When deleting a generation, use optimistic update for instant UI feedback:

```typescript
useMutation({
  mutationFn: deleteGeneration,
  onMutate: async (id) => {
    await queryClient.cancelQueries({ queryKey: ["generations"] });
    const previous = queryClient.getQueryData(["generations"]);
    queryClient.setQueryData(["generations"], (old) => ({
      ...old,
      data: old.data.filter((g) => g.id !== id),
    }));
    return { previous };
  },
  onError: (err, id, context) => {
    queryClient.setQueryData(["generations"], context.previous);
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ["generations"] });
  },
});
```

## File Structure

```
frontend/src/features/history/
├── queries.ts                          # Tanstack Query hooks
├── components/
│   ├── generation-grid.tsx             # Grid of generation cards
│   ├── generation-card.tsx             # Single card component
│   └── generation-detail-modal.tsx     # Detail modal
```
