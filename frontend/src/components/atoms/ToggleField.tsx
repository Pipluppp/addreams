import { Switch } from "@heroui/react";
import { cn } from "../../lib/cn";

type ToggleFieldProps = {
  id: string;
  label: string;
  helperText?: string;
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  className?: string;
  disabled?: boolean;
  isDisabled?: boolean;
  name?: string;
  value?: string;
  "aria-label"?: string;
};

export function ToggleField({
  id,
  label,
  helperText,
  checked,
  defaultChecked,
  onChange,
  className,
  disabled,
  isDisabled,
  name,
  value,
  "aria-label": ariaLabel,
}: ToggleFieldProps) {
  return (
    <Switch
      id={id}
      name={name ?? id}
      value={value}
      isSelected={checked}
      defaultSelected={defaultChecked}
      onChange={onChange}
      isDisabled={isDisabled ?? disabled}
      aria-label={ariaLabel ?? label}
      className={cn("switch", className)}
    >
      <span className="flex flex-col gap-1">
        <span className="font-medium text-ink">{label}</span>
        {helperText ? <span className="text-xs text-ink-muted">{helperText}</span> : null}
      </span>
      <Switch.Control className="switch__control">
        <Switch.Thumb className="switch__thumb" />
      </Switch.Control>
    </Switch>
  );
}
