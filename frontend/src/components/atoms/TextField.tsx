import { Description, FieldError, Input, Label, TextField as HeroTextField } from "@heroui/react";
import type { InputHTMLAttributes } from "react";
import { cn } from "../../lib/cn";

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  label: string;
  helperText?: string;
  error?: string;
};

export function TextField({ id, label, helperText, error, className, ...props }: TextFieldProps) {
  const { name, autoComplete, ...inputProps } = props;
  const fieldName = name ?? id;
  const autoCompleteValue = autoComplete ?? "off";

  return (
    <HeroTextField isInvalid={Boolean(error)} className="text-field">
      <Label>{label}</Label>
      <Input
        id={id}
        name={fieldName}
        autoComplete={autoCompleteValue}
        className={cn(className)}
        {...inputProps}
      />
      {helperText ? <Description>{helperText}</Description> : null}
      {error ? <FieldError>{error}</FieldError> : null}
    </HeroTextField>
  );
}
