export type ProductShootsStudioState =
  | "entry"
  | "guided-compose"
  | "template-picker"
  | "guided-results"
  | "edit-single";

export type ProductShootsGuidedComposeStep = "product" | "templates" | "direction";

export type ProductShootsStudioEvent =
  | "START_GUIDED"
  | "OPEN_TEMPLATE_PICKER"
  | "CLOSE_TEMPLATE_PICKER"
  | "GENERATE_SUCCESS"
  | "OPEN_EDITOR"
  | "BACK_TO_RESULTS"
  | "RESET_TO_ENTRY";

const allowedTransitions: Record<ProductShootsStudioState, ProductShootsStudioEvent[]> = {
  entry: ["START_GUIDED"],
  "guided-compose": ["OPEN_TEMPLATE_PICKER", "GENERATE_SUCCESS", "RESET_TO_ENTRY"],
  "template-picker": ["CLOSE_TEMPLATE_PICKER", "RESET_TO_ENTRY"],
  "guided-results": ["OPEN_EDITOR", "RESET_TO_ENTRY"],
  "edit-single": ["BACK_TO_RESULTS", "RESET_TO_ENTRY"],
};

export function transitionProductShootsState(
  current: ProductShootsStudioState,
  event: ProductShootsStudioEvent,
): ProductShootsStudioState {
  if (!allowedTransitions[current].includes(event)) {
    return current;
  }

  switch (event) {
    case "START_GUIDED":
      return "guided-compose";
    case "OPEN_TEMPLATE_PICKER":
      return "template-picker";
    case "CLOSE_TEMPLATE_PICKER":
      return "guided-compose";
    case "GENERATE_SUCCESS":
      return "edit-single";
    case "OPEN_EDITOR":
      return "edit-single";
    case "BACK_TO_RESULTS":
      return "guided-results";
    case "RESET_TO_ENTRY":
      return "entry";
    default:
      return current;
  }
}

type GuidedGenerateGuardInput = {
  isPending: boolean;
  isOutOfCredits: boolean;
  hasReference: boolean;
  selectedTemplateCount: number;
  prompt: string;
};

type GuidedStepGuardInput = {
  hasReference: boolean;
  selectedTemplateCount: number;
};

export function canGenerateGuidedShoots(input: GuidedGenerateGuardInput): boolean {
  if (input.isPending || input.isOutOfCredits || !input.hasReference) {
    return false;
  }

  return input.selectedTemplateCount > 0 || input.prompt.trim().length > 0;
}

export function canMoveToNextGuidedComposeStep(
  currentStep: ProductShootsGuidedComposeStep,
  input: GuidedStepGuardInput,
): boolean {
  if (currentStep === "product") {
    return input.hasReference;
  }

  if (currentStep === "templates") {
    return input.selectedTemplateCount > 0;
  }

  return true;
}

type EditorGenerateGuardInput = {
  isPending: boolean;
  isOutOfCredits: boolean;
  selectedImageUrl: string | null;
  editPrompt: string;
};

export function canRegenerateSingleImage(input: EditorGenerateGuardInput): boolean {
  if (input.isPending || input.isOutOfCredits) {
    return false;
  }

  if (!input.selectedImageUrl) {
    return false;
  }

  return input.editPrompt.trim().length > 0;
}
