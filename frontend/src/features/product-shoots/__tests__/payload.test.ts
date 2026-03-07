import { describe, expect, it } from "vitest";
import { buildProductShootsPayload } from "../payload";
import { MAX_PROMPT_LENGTH } from "../../parameters/constants";
import {
  composeTemplateShotNegativePrompt,
  composeTemplateShotPrompt,
  getTemplateById,
  PRODUCT_SHOOTS_TEMPLATES,
} from "../templates";

describe("buildProductShootsPayload", () => {
  it("builds an image-reference payload for product shoots", () => {
    const referenceImageUrl = "data:image/png;base64,AAAA";
    const payload = buildProductShootsPayload({
      prompt: "Clean minimal studio look",
      negative_prompt: "",
      size: "1328*1328",
      watermark: false,
      output_format: "png",
      referenceImageUrl,
    });

    expect(payload.referenceImageUrl).toBe(referenceImageUrl);
    expect(payload.input.messages[0]?.content[0]).toEqual({
      type: "image",
      image: referenceImageUrl,
    });
    expect(payload.input.messages[0]?.content[1]).toEqual({
      type: "text",
      text: "Clean minimal studio look",
    });
  });
});

describe("composeTemplateShotPrompt", () => {
  it("keeps template direction while preserving reference product identity", () => {
    const template = PRODUCT_SHOOTS_TEMPLATES[0];
    expect(template).toBeDefined();
    if (!template) {
      return;
    }

    const prompt = composeTemplateShotPrompt(template);

    expect(prompt).toContain("exact product");
    expect(prompt).toContain("Preserve product identity");
    expect(prompt).toContain(template.promptSeed);
  });

  it("uses custom scene instructions for specialized templates", () => {
    const template = getTemplateById("general-handoff-hero");
    expect(template).toBeDefined();
    if (!template) {
      return;
    }

    const prompt = composeTemplateShotPrompt(template);

    expect(prompt).toContain("Do not replace it with a different object or package.");
    expect(prompt).toContain("exactly two cropped forearms");
    expect(prompt).toContain("paper texture");
    expect(prompt).toContain("No poster text");
    expect(prompt.length).toBeLessThanOrEqual(MAX_PROMPT_LENGTH);
  });

  it("merges template and user negative prompts for specialized templates", () => {
    const template = getTemplateById("general-handoff-hero");
    expect(template).toBeDefined();
    if (!template) {
      return;
    }

    const negativePrompt = composeTemplateShotNegativePrompt(
      template,
      "busy props, messy lighting",
    );

    expect(negativePrompt).toContain("extra hands");
    expect(negativePrompt).toContain("flat gray background");
    expect(negativePrompt).toContain("busy props, messy lighting");
  });
});
