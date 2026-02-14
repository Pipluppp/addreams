import { QWEN_SIZE_PRESETS } from "../../features/parameters/constants";
import { SelectField } from "../atoms/SelectField";

type SizePresetSelectProps = {
  id: string;
  value: string;
  onChange: (next: string) => void;
  error?: string;
  label?: string;
  helperText?: string;
  disabled?: boolean;
};

const options = QWEN_SIZE_PRESETS.map((size) => ({
  label: size,
  value: size,
}));

export function SizePresetSelect({
  id,
  value,
  onChange,
  error,
  label = "Size",
  helperText,
  disabled,
}: SizePresetSelectProps) {
  return (
    <SelectField
      id={id}
      label={label}
      value={value}
      onChange={onChange}
      options={options}
      helperText={helperText}
      error={error}
      isDisabled={disabled}
    />
  );
}
