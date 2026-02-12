import { Frame } from "../atoms/Frame";

type ValidationSummaryProps = {
  title?: string;
  checks: Array<{ label: string; valid: boolean }>;
};

export function ValidationSummary({
  title = "Validation Summary",
  checks,
}: ValidationSummaryProps) {
  return (
    <Frame className="space-y-3 p-4">
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      <ul className="space-y-2 text-sm text-ink-soft">
        {checks.map((check) => (
          <li key={check.label} className="flex items-center justify-between gap-2">
            <span>{check.label}</span>
            <span
              className={
                check.valid
                  ? "accent-type text-[10px] uppercase tracking-[0.16em] text-success"
                  : "accent-type text-[10px] uppercase tracking-[0.16em] text-error"
              }
            >
              {check.valid ? "Valid" : "Needs Input"}
            </span>
          </li>
        ))}
      </ul>
    </Frame>
  );
}
