# Qwen-Image-Edit-Max API Reference (DashScope)

Self-contained implementation reference for `qwen-image-edit-max` in Addreams.

Official sources:
- https://www.alibabacloud.com/help/en/model-studio/qwen-image-edit-api
- https://www.alibabacloud.com/help/en/model-studio/model-pricing
- https://www.alibabacloud.com/help/en/model-studio/rate-limit
- https://www.alibabacloud.com/help/en/model-studio/error-code

Verified against official docs on `2026-02-14`.

## Supported model IDs

- `qwen-image-edit-max`
- `qwen-image-edit-max-2026-01-16` (snapshot)

`qwen-image-edit-max` currently has the same capabilities as `qwen-image-edit-max-2026-01-16`.

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
  "model": "qwen-image-edit-max",
  "input": {
    "messages": [
      {
        "role": "user",
        "content": [
          { "image": "https://example.com/input1.png" },
          { "image": "https://example.com/input2.png" },
          { "text": "Make the subject in Image 1 wear the outfit from Image 2." }
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

- `model`: `qwen-image-edit-max` (or snapshot ID).
- `input.messages`: exactly one message.
- `input.messages[0].role`: must be `user`.
- `input.messages[0].content`: must include:
  - `1` to `3` image objects: `{ "image": "<url-or-base64>" }`
  - exactly one text instruction: `{ "text": "..." }`

### Image input rules

- Supported formats: `JPG`, `JPEG`, `PNG`, `BMP`, `TIFF`, `WEBP`, `GIF`.
- GIF: only first frame is processed.
- Max file size per image: `10 MB`.
- Recommended dimensions: both width/height between `384` and `3072` px.
- Input can be public URL (`http` or `https`) or Base64 data URI.

Base64 format must include prefix:

`data:image/jpeg;base64,/9j/4AAQSk...`

### Parameter rules

- `text` max length: `800` chars (auto-truncated if longer).
- `negative_prompt` max length: `500` chars (auto-truncated if longer).
- `n` default: `1`; max-series supports `1` to `6`.
- `seed` range: `[0, 2147483647]`.
- `prompt_extend` default: `true`.
- `watermark` default: `false`.

`size` (supported in max/plus series):
- Format: `width*height`
- Width and height range: `[512, 2048]`
- Service rounds to nearest multiples of 16.
- If omitted, output keeps aspect ratio close to input (or last input image in multi-image mode), around `1024*1024`.

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

## Image URL allowlist (if your network blocks public OSS)

If outbound access is restricted, allow these hosts:

```txt
dashscope-result-bj.oss-cn-beijing.aliyuncs.com
dashscope-result-hz.oss-cn-hangzhou.aliyuncs.com
dashscope-result-sh.oss-cn-shanghai.aliyuncs.com
dashscope-result-wlcb.oss-cn-wulanchabu.aliyuncs.com
dashscope-result-zjk.oss-cn-zhangjiakou.aliyuncs.com
dashscope-result-sz.oss-cn-shenzhen.aliyuncs.com
dashscope-result-hy.oss-cn-heyuan.aliyuncs.com
dashscope-result-cd.oss-cn-chengdu.aliyuncs.com
dashscope-result-gz.oss-cn-guangzhou.aliyuncs.com
dashscope-result-wlcb-acdr-1.oss-cn-wulanchabu-acdr-1.aliyuncs.com
```

## Billing and quotas

Pricing, free quota, and rate limits are region-specific and can change. Check:
- https://www.alibabacloud.com/help/en/model-studio/model-pricing
- https://www.alibabacloud.com/help/en/model-studio/rate-limit

## Async support

Asynchronous API is not supported for Qwen image editing models in this API.

## Addreams backend checklist

- Enforce exactly 1 text instruction and 1-3 image inputs.
- Validate image transport format (URL or Base64 data URI).
- Validate image size <= 10 MB before upstream call when possible.
- Validate `n` in `1..6` for `qwen-image-edit-max`.
- Validate `size` bounds (`512..2048`) if provided.
- Return and log `request_id` for support/debugging.
- Surface `code` and `message` from DashScope as structured API errors.
- Persist output images if frontend needs URLs beyond 24h.

## Cloudflare Worker fetch example (TypeScript)

```ts
type ImageInput = { image: string };
type QwenImageEditRequest = {
  images: string[];
  prompt: string;
  negativePrompt?: string;
  n?: number;
  size?: string;
  seed?: number;
  promptExtend?: boolean;
  watermark?: boolean;
};

export async function editWithQwenImageEditMax(
  req: QwenImageEditRequest,
  apiKey: string,
  region: "sg" | "bj" = "sg",
): Promise<{ imageUrls: string[]; requestId: string }> {
  if (req.images.length < 1 || req.images.length > 3) {
    throw new Error("qwen-image-edit-max requires 1 to 3 input images");
  }

  const endpoint =
    region === "sg"
      ? "https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation"
      : "https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation";

  const content: Array<ImageInput | { text: string }> = [
    ...req.images.map((image) => ({ image })),
    { text: req.prompt },
  ];

  const body = {
    model: "qwen-image-edit-max",
    input: {
      messages: [{ role: "user", content }],
    },
    parameters: {
      n: req.n ?? 1,
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
