import type { ReactNode } from "react";
import { cn } from "../../lib/cn";

type GuidanceCalloutProps = {
  tone: "tip" | "warning" | "info";
  children: ReactNode;
};

const TONE_CLASSES: Record<GuidanceCalloutProps["tone"], string> = {
  tip: "border-accent/30 bg-accent/5 text-ink",
  warning: "border-warning/30 bg-warning/5 text-ink",
  info: "border-ink-muted/20 bg-surface-alt text-ink-soft",
};

const TONE_LABELS: Record<GuidanceCalloutProps["tone"], string> = {
  tip: "Tip",
  warning: "Heads up",
  info: "Info",
};

export function GuidanceCallout({ tone, children }: GuidanceCalloutProps) {
  return (
    <div className={cn("rounded-lg border px-3 py-2.5 text-xs leading-relaxed", TONE_CLASSES[tone])}>
      <span className="font-semibold">{TONE_LABELS[tone]}:</span> {children}
    </div>
  );
}
