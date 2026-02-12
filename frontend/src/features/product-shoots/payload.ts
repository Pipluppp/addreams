import type { ProductShootsRequest } from "../../lib/api";
import type { ProductShootsFormValues } from "./schema";

export function buildProductShootsPayload(values: ProductShootsFormValues): ProductShootsRequest {
  const prompt = values.prompt.trim();
  const negativePrompt = values.negative_prompt.trim();

  return {
    prompt,
    model: "image-generation-latest",
    input: {
      messages: [
        {
          role: "user",
          content: [{ type: "text", text: prompt }],
        },
      ],
    },
    parameters: {
      size: values.size,
      n: 1,
      prompt_extend: values.prompt_extend,
      watermark: false,
      response_format: "url",
      output_format: values.output_format,
      negative_prompt: negativePrompt.length ? negativePrompt : undefined,
    },
  };
}
