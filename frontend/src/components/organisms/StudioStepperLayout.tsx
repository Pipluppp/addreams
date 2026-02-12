import type { ReactNode } from "react";
import type { StepStatus } from "../../lib/stepper";
import { Frame } from "../atoms/Frame";
import { PillButton } from "../atoms/PillButton";
import { ProgressStepper } from "../molecules/ProgressStepper";
import { StepHeader } from "../molecules/StepHeader";

type StudioStep = {
  id: string;
  label: string;
};

type StudioStepperLayoutProps = {
  workflow: string;
  title: string;
  description: string;
  steps: readonly StudioStep[];
  statuses: readonly StepStatus[];
  currentStep: number;
  onStepSelect: (index: number) => void;
  canSelectStep: (index: number) => boolean;
  onBack: () => void;
  canBack: boolean;
  onPrimaryAction: () => void;
  primaryActionLabel: string;
  primaryActionPendingLabel?: string;
  primaryActionTone?: "primary" | "secondary";
  isPrimaryPending?: boolean;
  isPrimaryDisabled?: boolean;
  children: ReactNode;
};

export function StudioStepperLayout({
  workflow,
  title,
  description,
  steps,
  statuses,
  currentStep,
  onStepSelect,
  canSelectStep,
  onBack,
  canBack,
  onPrimaryAction,
  primaryActionLabel,
  primaryActionPendingLabel = primaryActionLabel,
  primaryActionTone = "primary",
  isPrimaryPending = false,
  isPrimaryDisabled = false,
  children,
}: StudioStepperLayoutProps) {
  return (
    <section className="space-y-4">
      <Frame className="space-y-6 p-5 sm:p-7">
        <StepHeader
          workflow={workflow}
          title={title}
          description={description}
          currentStep={currentStep}
          totalSteps={steps.length}
        />
        <ProgressStepper
          steps={steps}
          statuses={statuses}
          currentStep={currentStep}
          onStepSelect={onStepSelect}
          canSelectStep={canSelectStep}
        />
        <div>{children}</div>
      </Frame>

      <div className="sticky bottom-3 z-20">
        <Frame className="bg-surface/95 p-3 shadow-[0_10px_36px_color-mix(in_srgb,var(--color-ink)_10%,transparent)] backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <PillButton type="button" tone="neutral" onClick={onBack} disabled={!canBack}>
              Back
            </PillButton>
            <PillButton
              type="button"
              tone={primaryActionTone}
              onClick={onPrimaryAction}
              disabled={isPrimaryDisabled || isPrimaryPending}
            >
              {isPrimaryPending ? primaryActionPendingLabel : primaryActionLabel}
            </PillButton>
          </div>
        </Frame>
      </div>
    </section>
  );
}
