import { TextField } from "../atoms/TextField";

type SeedInputProps = {
  id: string;
  value: string;
  onChange: (next: string) => void;
  error?: string;
};

export function SeedInput({ id, value, onChange, error }: SeedInputProps) {
  return (
    <TextField
      id={id}
      label="Seed"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder="Optional deterministic seed"
      inputMode="numeric"
      error={error}
      helperText="Integer from 0 to 2147483647. Leave empty for random seed."
    />
  );
}
