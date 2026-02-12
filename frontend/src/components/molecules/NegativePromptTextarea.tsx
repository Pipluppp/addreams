import { MAX_NEGATIVE_PROMPT_LENGTH } from "../../features/parameters/constants";
import { TextareaField } from "../atoms/TextareaField";

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
    <div className="space-y-2">
      <TextareaField
        id={id}
        label="Negative Prompt"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Describe what to avoid in the image..."
        rows={4}
        error={error}
      />
      <p className="text-xs text-muted">
        {value.length}/{MAX_NEGATIVE_PROMPT_LENGTH}
      </p>
    </div>
  );
}
