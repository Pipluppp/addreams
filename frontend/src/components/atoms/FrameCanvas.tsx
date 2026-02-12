import { Frame } from "./Frame";
import { SquircleSurface } from "./SquircleSurface";

export function FrameCanvas({ label }: { label: string }) {
  return (
    <Frame className="p-4">
      <SquircleSurface asChild radius="xl" smooth="lg">
        <div className="relative min-h-44 overflow-hidden bg-surface-alt">
          <div className="absolute inset-0 bg-[linear-gradient(112deg,transparent_0%,color-mix(in_srgb,var(--color-accent-highlight)_18%,transparent)_45%,transparent_100%)] opacity-70" />
          <div className="relative z-10 flex min-h-44 items-center justify-center text-center text-sm text-ink-soft">
            {label}
          </div>
        </div>
      </SquircleSurface>
    </Frame>
  );
}
