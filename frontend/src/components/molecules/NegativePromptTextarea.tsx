import { Description, FieldError, Label, TextArea, TextField as HeroTextField } from "@heroui/react";
import { MAX_NEGATIVE_PROMPT_LENGTH } from "../../features/parameters/constants";

type NegativePromptTextareaProps = {
  id: string;
  value: string;
  onChange: (next: string) => void;
  error?: string;
};

export function NegativePromptTextarea({
  id,
  value,
  onChange,
  error,
}: NegativePromptTextareaProps) {
  return (
    <HeroTextField isInvalid={Boolean(error)} className="text-field">
      <Label>Negative Prompt</Label>
      <TextArea
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Describe what to avoid in the image…"
        rows={4}
        maxLength={MAX_NEGATIVE_PROMPT_LENGTH}
      />
      <div className="flex items-center justify-between gap-2">
        {error ? <FieldError>{error}</FieldError> : <span />}
        <Description className="text-xs tabular-nums text-ink-muted">
          {value.length}/{MAX_NEGATIVE_PROMPT_LENGTH}
        </Description>
      </div>
    </HeroTextField>
  );
}
