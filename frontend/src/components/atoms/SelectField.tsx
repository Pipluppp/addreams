import { Description, FieldError, Label, ListBox, Select } from "@heroui/react";
import { cn } from "../../lib/cn";

type SelectOption = {
  label: string;
  value: string;
};

type SelectFieldProps = {
  id: string;
  label: string;
  options: SelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  helperText?: string;
  error?: string;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  isDisabled?: boolean;
  name?: string;
  autoComplete?: string;
};

export function SelectField({
  id,
  label,
  options,
  value,
  onChange,
  helperText,
  error,
  className,
  placeholder = "Select an option",
  disabled,
  isDisabled,
  name,
  autoComplete,
}: SelectFieldProps) {
  const fieldName = name ?? id;
  const autoCompleteValue = autoComplete ?? "off";

  return (
    <Select
      name={fieldName}
      autoComplete={autoCompleteValue}
      value={value ?? null}
      onChange={(next) => {
        if (next == null || Array.isArray(next)) {
          return;
        }
        onChange?.(String(next));
      }}
      isInvalid={Boolean(error)}
      isDisabled={isDisabled ?? disabled}
      placeholder={placeholder}
      fullWidth
      className={cn("select", className)}
    >
      <Label>{label}</Label>
      <Select.Trigger id={id} className="select__trigger">
        <Select.Value />
        <Select.Indicator />
      </Select.Trigger>
      {helperText ? <Description>{helperText}</Description> : null}
      {error ? <FieldError>{error}</FieldError> : null}
      <Select.Popover className="select__popover">
        <ListBox>
          {options.map((option) => (
            <ListBox.Item key={option.value} id={option.value} textValue={option.label}>
              {option.label}
            </ListBox.Item>
          ))}
        </ListBox>
      </Select.Popover>
    </Select>
  );
}
