import type { ReactNode } from "react";
import { Frame } from "./Frame";

type SectionShellProps = {
  heading: string;
  eyebrow?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
};

export function SectionShell({
  heading,
  eyebrow,
  description,
  actions,
  children,
}: SectionShellProps) {
  return (
    <Frame className="p-5 sm:p-7">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          {eyebrow ? (
            <p className="accent-type text-[10px] uppercase tracking-[0.2em] text-ink-muted">
              {eyebrow}
            </p>
          ) : null}
          <h2 className="ui-title max-w-3xl text-ink">{heading}</h2>
          {description ? <p className="max-w-3xl text-sm text-ink-soft">{description}</p> : null}
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </header>
      <div className="mt-6">{children}</div>
    </Frame>
  );
}
