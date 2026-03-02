import type { ReactNode } from "react";
import { Card } from "@heroui/react";

type SingleImageEditorLayoutProps = {
  canvas: ReactNode;
  tools: ReactNode;
  thumbnails: ReactNode;
};

export function SingleImageEditorLayout({
  canvas,
  tools,
  thumbnails,
}: SingleImageEditorLayoutProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-[1.6fr_0.9fr]">
        <Card className="border border-studio-border bg-studio-surface p-4">{canvas}</Card>
        <Card className="border border-studio-border bg-studio-surface p-4">{tools}</Card>
      </div>
      <Card className="border border-studio-border bg-studio-surface p-3">{thumbnails}</Card>
    </div>
  );
}
