import type { AdGraphicsRequest } from "../../lib/api";
import { fileToDataUrl } from "../../lib/image-validation";
import type { AdGraphicsFormValues } from "./schema";

async function resolveReferenceImage(values: AdGraphicsFormValues): Promise<string> {
  if (values.referenceMode === "url") {
    return values.referenceImageUrl.trim();
  }

  if (values.referenceImageFile) {
    return fileToDataUrl(values.referenceImageFile);
  }

  return "";
}

function resolveSize(values: AdGraphicsFormValues): AdGraphicsRequest["parameters"]["size"] {
  if (values.sizeMode === "preset") {
    return values.sizePreset;
  }

  const width = Number(values.customWidth.trim());
  const height = Number(values.customHeight.trim());
  return `${width}*${height}`;
}

export async function buildAdGraphicsPayload(
  values: AdGraphicsFormValues,
): Promise<AdGraphicsRequest> {
  const prompt = values.prompt.trim();
  const referenceImageUrl = await resolveReferenceImage(values);
  const negativePrompt = values.negative_prompt.trim();

  return {
    prompt,
    referenceImageUrl,
    model: "image-edit-latest",
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
      n: 1,
      negative_prompt: negativePrompt.length ? negativePrompt : undefined,
      size: resolveSize(values),
      prompt_extend: values.prompt_extend,
      watermark: false,
    },
  };
}
