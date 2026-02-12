export function FrameCanvas({ label }: { label: string }) {
  return (
    <div className="border border-frame bg-surface p-4">
      <div className="relative min-h-44 overflow-hidden border border-border-subtle bg-canvas">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,var(--color-surface-soft)_0%,transparent_32%,var(--color-surface-soft)_64%)] animate-canvas-scan" />
        <div className="relative z-10 flex min-h-44 items-center justify-center text-center text-sm text-muted">
          {label}
        </div>
      </div>
    </div>
  );
}
