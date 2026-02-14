# Qwen-Image-Max API Reference (DashScope)

Self-contained implementation reference for `qwen-image-max` in Addreams.

Official sources:
- https://www.alibabacloud.com/help/en/model-studio/qwen-image-api
- https://www.alibabacloud.com/help/en/model-studio/model-pricing
- https://www.alibabacloud.com/help/en/model-studio/rate-limit
- https://www.alibabacloud.com/help/en/model-studio/error-code

Verified against official docs on `2026-02-14`.

## Supported model IDs

- `qwen-image-max`
- `qwen-image-max-2025-12-30` (snapshot)

`qwen-image-max` currently has the same capabilities as `qwen-image-max-2025-12-30`.

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
  "model": "qwen-image-max",
  "input": {
    "messages": [
      {
        "role": "user",
        "content": [
          { "text": "A realistic photo of a mountain at sunset" }
        ]
      }
    ]
  },
  "parameters": {
    "negative_prompt": "blurry, low quality",
    "size": "1664*928",
    "n": 1,
    "prompt_extend": true,
    "watermark": false,
    "seed": 123456
  }
}
```

### Required fields

- `model`: must be `qwen-image-max` (or snapshot ID).
- `input.messages`: exactly one message.
- `input.messages[0].role`: must be `user`.
- `input.messages[0].content`: exactly one text object: `{ "text": "..." }`.

### Parameter rules

- `text` max length: `800` chars (auto-truncated if longer).
- `negative_prompt` max length: `500` chars (auto-truncated if longer).
- `n` is currently fixed to `1`; any other value fails.
- `seed` range: `[0, 2147483647]`.
- `prompt_extend` default: `true`.
- `watermark` default: `false`.

### Allowed `size` values

- `1664*928` (default, 16:9)
- `1472*1104` (4:3)
- `1328*1328` (1:1)
- `1104*1472` (3:4)
- `928*1664` (9:16)

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
    ],
    "task_metric": {
      "TOTAL": 1,
      "SUCCEEDED": 1,
      "FAILED": 0
    }
  },
  "usage": {
    "image_count": 1,
    "width": 1664,
    "height": 928
  },
  "request_id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
}
```

Image URL path:

`output.choices[0].message.content[0].image`

## Error response shape

```json
{
  "request_id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "code": "InvalidParameter",
  "message": "num_images_per_prompt must be 1"
}
```

## Operational behavior

- Output format is PNG.
- Output image URL is valid for ~24 hours.
- Task data and URL are retained for 24 hours only.
- Persist the generated image immediately if it must be durable.

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

`qwen-image-max` does not support asynchronous API calls.

Only `qwen-image-plus` and `qwen-image` support async endpoints.

## Addreams backend checklist

- Enforce exactly 1 message and exactly 1 text content item.
- Enforce `n = 1`.
- Validate `size` against the allowed set.
- Return and store `request_id` for troubleshooting.
- Surface `code` and `message` from DashScope as structured API errors.
- Download/persist image to durable storage if URLs are needed beyond 24h.

## Cloudflare Worker fetch example (TypeScript)

```ts
type QwenImageMaxRequest = {
  prompt: string;
  negativePrompt?: string;
  size?: "1664*928" | "1472*1104" | "1328*1328" | "1104*1472" | "928*1664";
  seed?: number;
  promptExtend?: boolean;
  watermark?: boolean;
};

export async function generateQwenImageMax(
  req: QwenImageMaxRequest,
  apiKey: string,
  region: "sg" | "bj" = "sg",
): Promise<{ imageUrl: string; requestId: string }> {
  const endpoint =
    region === "sg"
      ? "https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation"
      : "https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation";

  const body = {
    model: "qwen-image-max",
    input: {
      messages: [
        {
          role: "user",
          content: [{ text: req.prompt }],
        },
      ],
    },
    parameters: {
      n: 1,
      size: req.size ?? "1664*928",
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

  const imageUrl = json?.output?.choices?.[0]?.message?.content?.[0]?.image;
  if (!imageUrl) throw new Error("Missing image URL in Qwen response");

  return { imageUrl, requestId: json.request_id };
}
```
