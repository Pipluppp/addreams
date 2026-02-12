import { OUTPUT_FORMATS } from "../../features/parameters/constants";
import { SelectField } from "../atoms/SelectField";

type OutputFormatSelectProps = {
  id: string;
  value: string;
  onChange: (next: "png" | "jpg") => void;
  error?: string;
};

const options = OUTPUT_FORMATS.map((format) => ({
  label: format.toUpperCase(),
  value: format,
}));

export function OutputFormatSelect({ id, value, onChange, error }: OutputFormatSelectProps) {
  return (
    <SelectField
      id={id}
      label="Output Format"
      value={value}
      onChange={(event) => onChange(event.target.value as "png" | "jpg")}
      options={options}
      error={error}
      helperText="Qwen-Image-Max supports png and jpg in this phase."
    />
  );
}
