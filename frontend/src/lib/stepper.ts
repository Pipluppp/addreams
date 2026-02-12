export type StepStatus = "not_started" | "in_progress" | "valid" | "blocked";

export function deriveStepStatuses(currentStep: number, stepValidity: boolean[]): StepStatus[] {
  return stepValidity.map((isValid, index) => {
    if (index === currentStep) {
      return "in_progress";
    }

    if (isValid) {
      return "valid";
    }

    if (index < currentStep) {
      return "blocked";
    }

    const isReachable = stepValidity.slice(0, index).every(Boolean);
    return isReachable ? "not_started" : "blocked";
  });
}

export function canNavigateToStep(
  targetStep: number,
  currentStep: number,
  stepValidity: boolean[],
) {
  if (targetStep <= currentStep) {
    return true;
  }

  return stepValidity.slice(0, targetStep).every(Boolean);
}
