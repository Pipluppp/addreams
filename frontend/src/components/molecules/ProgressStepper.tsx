import type { StepStatus } from "../../lib/stepper";
import { cn } from "../../lib/cn";

type ProgressStep = {
  id: string;
  label: string;
};

type ProgressStepperProps = {
  steps: readonly ProgressStep[];
  statuses: readonly StepStatus[];
  currentStep: number;
  onStepSelect: (index: number) => void;
  canSelectStep: (index: number) => boolean;
};

const STEP_CARD_TONE: Record<StepStatus, string> = {
  valid: "bg-[color-mix(in_srgb,var(--color-accent-secondary)_15%,var(--color-surface))]",
  in_progress: "bg-[color-mix(in_srgb,var(--color-accent-primary)_15%,var(--color-surface))]",
  not_started: "bg-surface",
  blocked: "bg-surface-alt text-ink-muted",
};

const STEP_BADGE_TONE: Record<StepStatus, string> = {
  valid: "bg-accent-secondary text-on-secondary",
  in_progress: "bg-accent-primary text-on-primary",
  not_started: "bg-surface-alt text-ink-soft",
  blocked: "bg-surface text-ink-muted",
};

export function ProgressStepper({
  steps,
  statuses,
  currentStep,
  onStepSelect,
  canSelectStep,
}: ProgressStepperProps) {
  const progress =
    steps.length > 1
      ? `${Math.max(0, Math.min(100, (currentStep / (steps.length - 1)) * 100))}%`
      : "100%";

  return (
    <div className="space-y-3">
      <div className="hidden rounded-2xl bg-surface-alt p-1 sm:block">
        <div className="h-2 overflow-hidden bg-surface">
          <div
            className="h-full bg-accent-primary transition-[width] duration-300"
            style={{ width: progress }}
          />
        </div>
      </div>

      <ol className="flex flex-col gap-2 md:flex-row md:gap-3" aria-label="Workflow steps">
        {steps.map((step, index) => {
          const status = statuses[index] ?? "not_started";
          const isCurrent = index === currentStep;
          const isClickable = canSelectStep(index);
          const isConnected = index < currentStep;
          const isConnectorCurrent = index === currentStep;

          return (
            <li key={step.id} className="relative md:flex-1">
              <button
                type="button"
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left",
                  STEP_CARD_TONE[status],
                  isCurrent &&
                    "shadow-[0_0_0_1px_color-mix(in_srgb,var(--color-accent-primary)_35%,transparent)]",
                  !isClickable && "cursor-not-allowed opacity-80",
                )}
                onClick={() => {
                  if (isClickable) {
                    onStepSelect(index);
                  }
                }}
                aria-current={isCurrent ? "step" : undefined}
                aria-disabled={!isClickable}
              >
                <div
                  className={cn(
                    "inline-flex min-h-8 min-w-8 items-center justify-center rounded-lg px-2 text-[10px]",
                    "accent-type uppercase tracking-[0.15em]",
                    STEP_BADGE_TONE[status],
                  )}
                >
                  {index + 1}
                </div>
                <div className="min-w-0">
                  <p className="accent-type text-[10px] uppercase tracking-[0.16em] text-ink-muted">
                    Step {index + 1}
                  </p>
                  <p className="line-clamp-1 text-sm font-medium text-ink">{step.label}</p>
                </div>
              </button>

              {index < steps.length - 1 ? (
                <>
                  <span
                    aria-hidden
                    className={cn(
                      "pointer-events-none absolute left-4 top-[calc(100%+2px)] h-3 w-1 md:hidden",
                      isConnected
                        ? "bg-accent-secondary"
                        : isConnectorCurrent
                          ? "bg-accent-primary"
                          : "bg-surface-alt",
                    )}
                  />
                  <span
                    aria-hidden
                    className={cn(
                      "pointer-events-none absolute left-[calc(100%-2px)] top-1/2 hidden h-1 w-4 -translate-y-1/2 md:block",
                      isConnected
                        ? "bg-accent-secondary"
                        : isConnectorCurrent
                          ? "bg-accent-primary"
                          : "bg-surface-alt",
                    )}
                  />
                </>
              ) : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
