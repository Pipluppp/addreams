import type { SelectHTMLAttributes } from "react";
import { cn } from "../../lib/cn";

type SelectOption = {
  label: string;
  value: string;
};

type SelectFieldProps = SelectHTMLAttributes<HTMLSelectElement> & {
  id: string;
  label: string;
  options: SelectOption[];
  helperText?: string;
  error?: string;
};

export function SelectField({
  id,
  label,
  options,
  helperText,
  error,
  className,
  ...props
}: SelectFieldProps) {
  const fieldName = props.name ?? id;
  const autoComplete = props.autoComplete ?? "off";

  return (
    <label htmlFor={id} className="flex flex-col gap-2 text-sm text-ink">
      <span className="font-medium text-ink">{label}</span>
      <select
        id={id}
        name={fieldName}
        autoComplete={autoComplete}
        className={cn(
          "w-full border border-frame bg-surface px-3 py-2 text-sm text-ink transition-colors duration-200 focus-visible:border-accent focus-visible:outline-none",
          error ? "border-error" : "",
          className,
        )}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : helperText ? `${id}-help` : undefined}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {helperText ? (
        <span id={`${id}-help`} className="text-xs text-muted">
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
