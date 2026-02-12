import type { TextareaHTMLAttributes } from "react";
import { cn } from "../../lib/cn";
import { SquircleSurface } from "./SquircleSurface";

type TextareaFieldProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  id: string;
  label: string;
  helperText?: string;
  error?: string;
};

export function TextareaField({
  id,
  label,
  helperText,
  error,
  className,
  ...props
}: TextareaFieldProps) {
  const fieldName = props.name ?? id;
  const autoComplete = props.autoComplete ?? "off";

  return (
    <label htmlFor={id} className="flex flex-col gap-2 text-sm text-ink">
      <span className="font-medium text-ink-soft">{label}</span>
      <SquircleSurface asChild radius="lg" smooth="md">
        <textarea
          id={id}
          name={fieldName}
          autoComplete={autoComplete}
          className={cn(
            "w-full bg-surface px-3 py-2.5 text-sm text-ink placeholder:text-ink-muted",
            error && "bg-[color-mix(in_srgb,var(--color-error)_8%,var(--color-surface))]",
            className,
          )}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : helperText ? `${id}-help` : undefined}
          {...props}
        />
      </SquircleSurface>
      {helperText ? (
        <span id={`${id}-help`} className="text-xs text-ink-muted">
          {helperText}
        </span>
      ) : null}
      {error ? (
        <span id={`${id}-error`} className="text-xs text-error" aria-live="polite">
          {error}
        </span>
      ) : null}
    </label>
  );
}
