import { FieldError, Label, TextArea, TextField as HeroTextField } from "@heroui/react";
import { MAX_PROMPT_LENGTH } from "../../features/parameters/constants";
import { cn } from "../../lib/cn";

type PromptTextareaProps = {
  id: string;
  value: string;
  onChange: (next: string) => void;
  error?: string;
  label?: string;
};

const SOFT_WARNING_THRESHOLD = 420;

export function PromptTextarea({
  id,
  value,
  onChange,
  error,
  label = "Prompt",
}: PromptTextareaProps) {
  const length = value.length;
  const warning = length >= SOFT_WARNING_THRESHOLD;

  return (
    <HeroTextField isInvalid={Boolean(error)} className="text-field">
      <Label>{label}</Label>
      <TextArea
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Describe the product scene, style, and composition…"
        rows={5}
        maxLength={MAX_PROMPT_LENGTH}
      />
      <div className="flex items-center justify-between gap-2">
        {error ? <FieldError>{error}</FieldError> : <span />}
        <span className={cn("text-xs tabular-nums", warning ? "text-warning" : "text-ink-muted")}>
          {length}/{MAX_PROMPT_LENGTH}
        </span>
      </div>
    </HeroTextField>
  );
}
