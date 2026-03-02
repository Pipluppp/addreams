import { describe, expect, it } from "vitest";
import {
  canGenerateGuidedShoots,
  canMoveToNextGuidedComposeStep,
  canRegenerateSingleImage,
  transitionProductShootsState,
} from "../studio-machine";

describe("transitionProductShootsState", () => {
  it("follows the guided happy-path transitions", () => {
    const guidedCompose = transitionProductShootsState("entry", "START_GUIDED");
    const picker = transitionProductShootsState(guidedCompose, "OPEN_TEMPLATE_PICKER");
    const composeAgain = transitionProductShootsState(picker, "CLOSE_TEMPLATE_PICKER");
    const editor = transitionProductShootsState(composeAgain, "GENERATE_SUCCESS");
    const results = transitionProductShootsState(editor, "BACK_TO_RESULTS");

    expect(guidedCompose).toBe("guided-compose");
    expect(picker).toBe("template-picker");
    expect(composeAgain).toBe("guided-compose");
    expect(editor).toBe("edit-single");
    expect(results).toBe("guided-results");
  });

  it("ignores invalid transitions", () => {
    const unchanged = transitionProductShootsState("entry", "OPEN_EDITOR");

    expect(unchanged).toBe("entry");
  });
});

describe("generation guards", () => {
  it("blocks guided generation when required state is missing", () => {
    const missingReference = canGenerateGuidedShoots({
      isPending: false,
      isOutOfCredits: false,
      hasReference: false,
      selectedTemplateCount: 2,
      prompt: "",
    });

    const missingIntent = canGenerateGuidedShoots({
      isPending: false,
      isOutOfCredits: false,
      hasReference: true,
      selectedTemplateCount: 0,
      prompt: "   ",
    });

    expect(missingReference).toBe(false);
    expect(missingIntent).toBe(false);
  });

  it("allows guided generation with templates + reference", () => {
    const canGenerate = canGenerateGuidedShoots({
      isPending: false,
      isOutOfCredits: false,
      hasReference: true,
      selectedTemplateCount: 1,
      prompt: "",
    });

    expect(canGenerate).toBe(true);
  });

  it("applies guided compose step guards", () => {
    expect(
      canMoveToNextGuidedComposeStep("product", {
        hasReference: false,
        selectedTemplateCount: 0,
      }),
    ).toBe(false);

    expect(
      canMoveToNextGuidedComposeStep("product", {
        hasReference: true,
        selectedTemplateCount: 0,
      }),
    ).toBe(true);

    expect(
      canMoveToNextGuidedComposeStep("templates", {
        hasReference: true,
        selectedTemplateCount: 0,
      }),
    ).toBe(false);
  });

  it("applies editor regenerate guard", () => {
    expect(
      canRegenerateSingleImage({
        isPending: false,
        isOutOfCredits: false,
        selectedImageUrl: "https://example.com/image.png",
        editPrompt: "Increase contrast",
      }),
    ).toBe(true);

    expect(
      canRegenerateSingleImage({
        isPending: true,
        isOutOfCredits: false,
        selectedImageUrl: "https://example.com/image.png",
        editPrompt: "Increase contrast",
      }),
    ).toBe(false);

    expect(
      canRegenerateSingleImage({
        isPending: false,
        isOutOfCredits: false,
        selectedImageUrl: null,
        editPrompt: "Increase contrast",
      }),
    ).toBe(false);
  });
});
