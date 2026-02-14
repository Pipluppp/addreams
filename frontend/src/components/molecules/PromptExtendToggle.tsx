import { ToggleField } from "../atoms/ToggleField";

type PromptExtendToggleProps = {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
};

export function PromptExtendToggle({ id, checked, onChange }: PromptExtendToggleProps) {
  return (
    <ToggleField
      id={id}
      label="Prompt Extend"
      helperText="Allow the model to rewrite and extend your prompt."
      checked={checked}
      onChange={(isSelected) => onChange(isSelected)}
    />
  );
}
