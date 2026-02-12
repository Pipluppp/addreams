import type { InputHTMLAttributes } from "react";
import { cn } from "../../lib/cn";
import { SquircleSurface } from "./SquircleSurface";

type ToggleFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  id: string;
  label: string;
  helperText?: string;
};

export function ToggleField({ id, label, helperText, className, ...props }: ToggleFieldProps) {
  return (
    <SquircleSurface asChild radius="lg" smooth="md">
      <label
        htmlFor={id}
        className={cn(
          "flex items-start justify-between gap-3 bg-surface px-3 py-2.5 text-sm",
          className,
        )}
      >
        <span className="flex flex-col gap-1">
          <span className="font-medium text-ink">{label}</span>
          {helperText ? <span className="text-xs text-ink-muted">{helperText}</span> : null}
        </span>
        <span className="relative mt-0.5 inline-flex items-center">
          <input
            id={id}
            type="checkbox"
            className="peer sr-only"
            {...props}
            aria-label={props["aria-label"] ?? label}
          />
          <SquircleSurface asChild radius="xl" smooth="lg">
            <span className="h-6 w-11 bg-surface-alt peer-checked:bg-accent-primary" />
          </SquircleSurface>
          <SquircleSurface asChild radius="xl" smooth="lg">
            <span className="pointer-events-none absolute left-0.5 h-5 w-5 bg-surface transition-transform duration-200 peer-checked:translate-x-5" />
          </SquircleSurface>
        </span>
      </label>
    </SquircleSurface>
  );
}
