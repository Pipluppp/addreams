import { describe, expect, it } from "vitest";
import {
  PRODUCT_SHOOTS_TEMPLATE_CAP,
  toggleTemplateSelection,
} from "../templates";

describe("toggleTemplateSelection", () => {
  it("adds templates until cap is reached", () => {
    let selection: string[] = [];

    selection = toggleTemplateSelection(selection, "t1", PRODUCT_SHOOTS_TEMPLATE_CAP);
    selection = toggleTemplateSelection(selection, "t2", PRODUCT_SHOOTS_TEMPLATE_CAP);
    selection = toggleTemplateSelection(selection, "t3", PRODUCT_SHOOTS_TEMPLATE_CAP);
    selection = toggleTemplateSelection(selection, "t4", PRODUCT_SHOOTS_TEMPLATE_CAP);
    selection = toggleTemplateSelection(selection, "t5", PRODUCT_SHOOTS_TEMPLATE_CAP);

    expect(selection).toEqual(["t1", "t2", "t3", "t4"]);
  });

  it("allows deselect even when cap was reached", () => {
    const atCap = ["t1", "t2", "t3", "t4"];

    const next = toggleTemplateSelection(atCap, "t2", PRODUCT_SHOOTS_TEMPLATE_CAP);

    expect(next).toEqual(["t1", "t3", "t4"]);
  });
});
