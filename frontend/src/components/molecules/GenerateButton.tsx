import { Button } from "@heroui/react";

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
    <Button type="submit" variant="primary" isPending={isPending} isDisabled={disabled || isPending}>
      {isPending ? pendingLabel : label}
    </Button>
  );
}
