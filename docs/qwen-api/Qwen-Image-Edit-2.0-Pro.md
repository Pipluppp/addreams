# Qwen-Image-Edit-2.0-Pro API Reference (DashScope)

Self-contained implementation reference for image editing with `qwen-image-2.0-pro` in Addreams.

Official sources:
- https://www.alibabacloud.com/help/en/model-studio/qwen-image-edit-api
- https://www.alibabacloud.com/help/en/model-studio/model-pricing
- https://www.alibabacloud.com/help/en/model-studio/rate-limit
- https://www.alibabacloud.com/help/en/model-studio/error-code

Verified against official docs on `2026-03-05`.

## Supported model IDs

- `qwen-image-2.0-pro`
- `qwen-image-2.0-pro-2026-03-03` (snapshot)

`qwen-image-2.0-pro` currently has the same capabilities as `qwen-image-2.0-pro-2026-03-03`.

This is a unified 2.0 model family (supports both text-to-image and image editing). This file covers image editing usage.

## Endpoint and Region

Synchronous API endpoint:
- Singapore: `POST https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation`
- Beijing: `POST https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation`

Important:
- Singapore and Beijing use different API keys.
- Do not mix key/endpoint regions.

## Headers

- `Authorization: Bearer $DASHSCOPE_API_KEY`
- `Content-Type: application/json`

## Request schema

```json
{
  "model": "qwen-image-2.0-pro",
  "input": {
    "messages": [
      {
        "role": "user",
        "content": [
          { "image": "https://example.com/input1.png" },
          { "image": "https://example.com/input2.png" },
          { "text": "Use image 1 as the base, apply the lighting style of image 2." }
        ]
      }
    ]
  },
  "parameters": {
    "n": 2,
    "negative_prompt": "blurry, low quality",
    "size": "1024*1536",
    "prompt_extend": true,
    "watermark": false,
    "seed": 123456
  }
}
```

### Required fields

- `model`: must be `qwen-image-2.0-pro` (or snapshot ID).
- `input.messages`: exactly one message.
- `input.messages[0].role`: must be `user`.
- `input.messages[0].content` must include:
  - `1` to `3` image objects: `{ "image": "<url-or-base64>" }`
  - exactly one text instruction: `{ "text": "..." }`

### Image input rules

- Supported formats: `JPG`, `JPEG`, `PNG`, `BMP`, `TIFF`, `WEBP`, `GIF`.
- GIF input uses only the first frame.
- Max file size per image: `10 MB`.
- Width/height recommendation: both dimensions between `384` and `3072` px.
- Input can be public URL (`http` or `https`) or Base64 data URI.

Base64 format must include prefix:

`data:image/jpeg;base64,/9j/4AAQSk...`

### Parameter rules

- `text` max length: `800` chars (auto-truncated if longer).
- `negative_prompt` max length: `500` chars (auto-truncated if longer).
- `n` default: `1`; supported range for 2.0 series: `1` to `6`.
- `size` format: `width*height`.
- `size` limits for 2.0 series: total pixels must be between `512*512` and `2048*2048`.
- `size` default for edit in 2.0 series: follows input image resolution (or last image in multi-image input).
- If `size` is provided, output dimensions are rounded to nearest multiples of `16`.
- `seed` range: `[0, 2147483647]`.
- `prompt_extend` default: `true`.
- `watermark` default: `false`.

## Success response shape

```json
{
  "output": {
    "choices": [
      {
        "finish_reason": "stop",
        "message": {
          "role": "assistant",
          "content": [
            { "image": "https://dashscope-result-xx.oss-cn-xxxx.aliyuncs.com/1.png?Expires=xxx" },
            { "image": "https://dashscope-result-xx.oss-cn-xxxx.aliyuncs.com/2.png?Expires=xxx" }
          ]
        }
      }
    ]
  },
  "usage": {
    "image_count": 2,
    "width": 1024,
    "height": 1536
  },
  "request_id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
}
```

Image URLs path:

`output.choices[0].message.content[].image`

For `n > 1`, multiple image objects are returned in `message.content`.

## Error response shape

```json
{
  "request_id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "code": "InvalidApiKey",
  "message": "Invalid API-key provided."
}
```

## Operational behavior

- Output format is PNG.
- Output image URLs are valid for ~24 hours.
- Task data and URLs are retained for 24 hours only.
- Persist generated images immediately if durable access is required.
- With fixed `seed` and unchanged inputs, repeated requests can still vary due to model probabilistic behavior.

## Image URL firewall note

Alibaba docs no longer publish a fixed OSS whitelist because backing domains can change. If your network requires strict egress allowlists, contact your Alibaba Cloud account team for the current OSS domain list.

## Billing and quotas

Pricing, free quota, and rate limits are region-specific and can change. Check:
- https://www.alibabacloud.com/help/en/model-studio/model-pricing
- https://www.alibabacloud.com/help/en/model-studio/rate-limit

## Async support

Asynchronous API is not supported for 2.0 image editing models in this API.

## Addreams backend checklist

- Enforce exactly 1 text instruction and 1-3 image inputs.
- Validate image transport format (URL or Base64 data URI).
- Validate image size `<= 10 MB` before upstream call when possible.
- Validate `n` in `1..6`.
- Validate `size` format and total pixels within `[512*512, 2048*2048]` when provided.
- Return and log `request_id` for support/debugging.
- Surface `code` and `message` from DashScope as structured API errors.
- Persist output images if frontend needs URLs beyond 24h.

## Cloudflare Worker fetch example (TypeScript)

```ts
type ImageInput = { image: string };
type QwenImageEdit20ProRequest = {
  images: string[];
  prompt: string;
  negativePrompt?: string;
  n?: number;
  size?: `${number}*${number}`;
  seed?: number;
  promptExtend?: boolean;
  watermark?: boolean;
};

function parseSize(size: string): { width: number; height: number } {
  const match = /^(\d+)\*(\d+)$/.exec(size);
  if (!match) throw new Error("size must be in width*height format");
  return { width: Number(match[1]), height: Number(match[2]) };
}

function validateQwenImageEdit20ProSize(size: string): void {
  const { width, height } = parseSize(size);
  const pixels = width * height;
  const minPixels = 512 * 512;
  const maxPixels = 2048 * 2048;
  if (pixels < minPixels || pixels > maxPixels) {
    throw new Error("qwen-image-2.0-pro edit size total pixels must be between 512*512 and 2048*2048");
  }
}

export async function editWithQwenImage20Pro(
  req: QwenImageEdit20ProRequest,
  apiKey: string,
  region: "sg" | "bj" = "sg",
): Promise<{ imageUrls: string[]; requestId: string }> {
  if (req.images.length < 1 || req.images.length > 3) {
    throw new Error("qwen-image-2.0-pro editing requires 1 to 3 input images");
  }

  const n = req.n ?? 1;
  if (n < 1 || n > 6) throw new Error("qwen-image-2.0-pro editing supports n in [1, 6]");

  if (req.size) validateQwenImageEdit20ProSize(req.size);

  const endpoint =
    region === "sg"
      ? "https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation"
      : "https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation";

  const content: Array<ImageInput | { text: string }> = [
    ...req.images.map((image) => ({ image })),
    { text: req.prompt },
  ];

  const body = {
    model: "qwen-image-2.0-pro",
    input: {
      messages: [{ role: "user", content }],
    },
    parameters: {
      n,
      negative_prompt: req.negativePrompt ?? "",
      prompt_extend: req.promptExtend ?? true,
      watermark: req.watermark ?? false,
      ...(req.size ? { size: req.size } : {}),
      ...(typeof req.seed === "number" ? { seed: req.seed } : {}),
    },
  };

  const resp = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const json = (await resp.json()) as any;
  if (!resp.ok || json.code) {
    throw new Error(`${json.code ?? resp.status}: ${json.message ?? "Qwen call failed"}`);
  }

  const imageUrls =
    json?.output?.choices?.[0]?.message?.content
      ?.map((x: any) => x?.image)
      .filter(Boolean) ?? [];

  if (!imageUrls.length) throw new Error("Missing image URLs in Qwen response");

  return { imageUrls, requestId: json.request_id };
}
```
