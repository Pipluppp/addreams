# Qwen-Image-2.0-Pro API Reference (DashScope)

Self-contained implementation reference for `qwen-image-2.0-pro` in Addreams.

Official sources:
- https://www.alibabacloud.com/help/en/model-studio/qwen-image-api
- https://www.alibabacloud.com/help/en/model-studio/model-pricing
- https://www.alibabacloud.com/help/en/model-studio/rate-limit
- https://www.alibabacloud.com/help/en/model-studio/error-code

Verified against official docs on `2026-03-05`.

## Supported model IDs

- `qwen-image-2.0-pro`
- `qwen-image-2.0-pro-2026-03-03` (snapshot)

`qwen-image-2.0-pro` currently has the same capabilities as `qwen-image-2.0-pro-2026-03-03`.

This is a unified 2.0 model family (supports both text-to-image and image editing). This file covers text-to-image usage.

## Endpoint and Region

Synchronous API endpoint (recommended):
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
          { "text": "A dramatic cinematic portrait with rain and neon reflections." }
        ]
      }
    ]
  },
  "parameters": {
    "negative_prompt": "low quality, distorted text",
    "size": "1024*1024",
    "n": 2,
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
- `input.messages[0].content`: exactly one text object: `{ "text": "..." }`.

### Parameter rules

- `text` max length: `800` chars (auto-truncated if longer).
- `negative_prompt` max length: `500` chars (auto-truncated if longer).
- `n` default: `1`; supported range for 2.0 series: `1` to `6`.
- `size` format: `width*height`.
- `size` limits for 2.0 series: total pixels must be between `512*512` and `2048*2048`.
- `size` default for 2.0 series: `1024*1024`.
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
            { "image": "https://dashscope-result-xx.oss-cn-xxxx.aliyuncs.com/xxx.png?Expires=xxx" }
          ]
        }
      }
    ]
  },
  "usage": {
    "image_count": 1,
    "width": 1024,
    "height": 1024
  },
  "request_id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
}
```

Image URL path:

`output.choices[0].message.content[0].image`

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
- `task_metric` may be omitted for 2.0 series responses.

## Image URL firewall note

Alibaba docs no longer publish a fixed OSS whitelist because backing domains can change. If your network requires strict egress allowlists, contact your Alibaba Cloud account team for the current OSS domain list.

## Billing and quotas

Pricing, free quota, and rate limits are region-specific and can change. Check:
- https://www.alibabacloud.com/help/en/model-studio/model-pricing
- https://www.alibabacloud.com/help/en/model-studio/rate-limit

## Async support

`qwen-image-2.0-pro` does not support asynchronous API calls in this API.

Only `qwen-image-plus` and `qwen-image` support async endpoints.

## Addreams backend checklist

- Enforce exactly 1 message and exactly 1 text content item.
- Enforce `n` in `1..6`.
- Validate `size` format and total pixels within `[512*512, 2048*2048]`.
- Return and store `request_id` for troubleshooting.
- Surface `code` and `message` from DashScope as structured API errors.
- Download/persist images if frontend URLs must work beyond 24h.

## Cloudflare Worker fetch example (TypeScript)

```ts
type QwenImage20ProRequest = {
  prompt: string;
  negativePrompt?: string;
  size?: `${number}*${number}`;
  n?: number;
  seed?: number;
  promptExtend?: boolean;
  watermark?: boolean;
};

function parseSize(size: string): { width: number; height: number } {
  const match = /^(\d+)\*(\d+)$/.exec(size);
  if (!match) throw new Error("size must be in width*height format");
  return { width: Number(match[1]), height: Number(match[2]) };
}

function validateQwenImage20ProSize(size: string): void {
  const { width, height } = parseSize(size);
  const pixels = width * height;
  const minPixels = 512 * 512;
  const maxPixels = 2048 * 2048;
  if (pixels < minPixels || pixels > maxPixels) {
    throw new Error("qwen-image-2.0-pro size total pixels must be between 512*512 and 2048*2048");
  }
}

export async function generateQwenImage20Pro(
  req: QwenImage20ProRequest,
  apiKey: string,
  region: "sg" | "bj" = "sg",
): Promise<{ imageUrls: string[]; requestId: string }> {
  const n = req.n ?? 1;
  if (n < 1 || n > 6) throw new Error("qwen-image-2.0-pro supports n in [1, 6]");

  const size = req.size ?? "1024*1024";
  validateQwenImage20ProSize(size);

  const endpoint =
    region === "sg"
      ? "https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation"
      : "https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation";

  const body = {
    model: "qwen-image-2.0-pro",
    input: {
      messages: [
        {
          role: "user",
          content: [{ text: req.prompt }],
        },
      ],
    },
    parameters: {
      n,
      size,
      negative_prompt: req.negativePrompt ?? "",
      prompt_extend: req.promptExtend ?? true,
      watermark: req.watermark ?? false,
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
