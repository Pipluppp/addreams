import { Description, Label, Switch } from "@heroui/react";
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
      className={cn("switch", className)}
    >
      <div className="flex flex-col gap-1">
        <Label className="font-medium text-ink">{label}</Label>
        {helperText ? <Description className="text-xs text-ink-muted">{helperText}</Description> : null}
      </div>
      <Switch.Control className="switch__control">
        <Switch.Thumb className="switch__thumb" />
      </Switch.Control>
    </Switch>
  );
}
