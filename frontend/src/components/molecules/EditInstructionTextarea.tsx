import { PromptTextarea } from "./PromptTextarea";

type EditInstructionTextareaProps = {
  id: string;
  label?: string;
  value: string;
  onChange: (next: string) => void;
  error?: string;
};

export function EditInstructionTextarea({
  id,
  label = "Edit Instruction",
  value,
  onChange,
  error,
}: EditInstructionTextareaProps) {
  return <PromptTextarea id={id} label={label} value={value} onChange={onChange} error={error} />;
}
