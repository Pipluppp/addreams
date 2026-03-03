import type { ProductShootsRequest } from "../../lib/api";
import type { ProductShootsFormValues } from "./schema";

export type ProductShootsGenerationValues = ProductShootsFormValues & {
  referenceImageUrl: string;
  productShootContext?: ProductShootsRequest["productShootContext"];
};

export function buildProductShootsPayload(
  values: ProductShootsGenerationValues,
): ProductShootsRequest {
  const prompt = values.prompt.trim();
  const negativePrompt = values.negative_prompt.trim();
  const referenceImageUrl = values.referenceImageUrl.trim();

  return {
    prompt,
    referenceImageUrl,
    ...(values.productShootContext ? { productShootContext: values.productShootContext } : {}),
    input: {
      messages: [
        {
          role: "user",
          content: [
            { type: "image", image: referenceImageUrl },
            { type: "text", text: prompt },
          ],
        },
      ],
    },
    parameters: {
      size: values.size,
      n: 1,
      prompt_extend: true,
      watermark: false,
      negative_prompt: negativePrompt.length ? negativePrompt : undefined,
    },
  };
}
