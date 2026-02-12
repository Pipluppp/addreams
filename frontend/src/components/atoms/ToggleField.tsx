import type { InputHTMLAttributes } from "react";
import { cn } from "../../lib/cn";

type ToggleFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  id: string;
  label: string;
  helperText?: string;
};

export function ToggleField({ id, label, helperText, className, ...props }: ToggleFieldProps) {
  return (
    <label
      htmlFor={id}
      className={cn(
        "flex items-start justify-between gap-3 border border-frame bg-surface px-3 py-2 text-sm",
        className,
      )}
    >
      <span className="flex flex-col gap-1">
        <span className="font-medium text-ink">{label}</span>
        {helperText ? <span className="text-xs text-muted">{helperText}</span> : null}
      </span>
      <span className="relative mt-0.5 inline-flex items-center">
        <input
          id={id}
          type="checkbox"
          className="peer sr-only"
          {...props}
          aria-label={props["aria-label"] ?? label}
        />
        <span className="h-5 w-10 border border-frame bg-surface-soft transition-colors duration-200 peer-checked:bg-accent" />
        <span className="pointer-events-none absolute left-0.5 h-4 w-4 bg-ink transition-transform duration-200 peer-checked:translate-x-5 peer-checked:bg-accent-ink" />
      </span>
    </label>
  );
}
