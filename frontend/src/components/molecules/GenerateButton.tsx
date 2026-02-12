import { PillButton } from "../atoms/PillButton";

type GenerateButtonProps = {
  label?: string;
  pendingLabel?: string;
  isPending: boolean;
  disabled?: boolean;
};

export function GenerateButton({
  label = "Generate",
  pendingLabel = "Generating...",
  isPending,
  disabled,
}: GenerateButtonProps) {
  return (
    <PillButton type="submit" disabled={disabled || isPending}>
      {isPending ? pendingLabel : label}
    </PillButton>
  );
}
