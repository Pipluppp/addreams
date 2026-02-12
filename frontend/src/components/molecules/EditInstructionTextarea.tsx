import { PromptTextarea } from "./PromptTextarea";

type EditInstructionTextareaProps = {
  id: string;
  value: string;
  onChange: (next: string) => void;
  error?: string;
};

export function EditInstructionTextarea({
  id,
  value,
  onChange,
  error,
}: EditInstructionTextareaProps) {
  return (
    <PromptTextarea
      id={id}
      label="Edit Instruction"
      value={value}
      onChange={onChange}
      error={error}
    />
  );
}
