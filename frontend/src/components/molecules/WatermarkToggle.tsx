import { ToggleField } from "../atoms/ToggleField";

type WatermarkToggleProps = {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
};

export function WatermarkToggle({ id, checked, onChange }: WatermarkToggleProps) {
  return (
    <ToggleField
      id={id}
      label="Watermark"
      helperText="Attach an output watermark for content provenance."
      checked={checked}
      onChange={(isSelected) => onChange(isSelected)}
    />
  );
}
