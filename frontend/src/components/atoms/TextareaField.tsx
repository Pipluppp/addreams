import { Description, FieldError, Label, TextArea, TextField as HeroTextField } from "@heroui/react";
import type { TextareaHTMLAttributes } from "react";
import { cn } from "../../lib/cn";

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
  const { name, autoComplete, ...textAreaProps } = props;
  const fieldName = name ?? id;
  const autoCompleteValue = autoComplete ?? "off";

  return (
    <HeroTextField isInvalid={Boolean(error)} className="text-field">
      <Label>{label}</Label>
      <TextArea
        id={id}
        name={fieldName}
        autoComplete={autoCompleteValue}
        className={cn(className)}
        {...textAreaProps}
      />
      {helperText ? <Description>{helperText}</Description> : null}
      {error ? <FieldError>{error}</FieldError> : null}
    </HeroTextField>
  );
}
