import { MAX_PROMPT_LENGTH } from "../../features/parameters/constants";
import { TextareaField } from "../atoms/TextareaField";

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
    <div className="space-y-2">
      <TextareaField
        id={id}
        label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Describe the product scene, style, and composition..."
        rows={5}
        error={error}
      />
      <p className={warning ? "text-xs text-warning" : "text-xs text-muted"}>
        {length}/{MAX_PROMPT_LENGTH}
      </p>
    </div>
  );
}
