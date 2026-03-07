# Qwen Image API Summary (DashScope)

Concise implementation summary for Qwen image generation/editing models used by Addreams.

Official sources:
- https://www.alibabacloud.com/help/en/model-studio/qwen-image-api
- https://www.alibabacloud.com/help/en/model-studio/qwen-image-edit-api
- https://www.alibabacloud.com/help/en/model-studio/model-pricing
- https://www.alibabacloud.com/help/en/model-studio/rate-limit
- https://www.alibabacloud.com/help/en/model-studio/error-code

Verified against official docs on `2026-03-05`.

## Common API Contract (All Models)

- Endpoint (SG): `POST https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation`
- Endpoint (BJ): `POST https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation`
- Header: `Authorization: Bearer $DASHSCOPE_API_KEY`
- Header: `Content-Type: application/json`
- Response image path: `output.choices[0].message.content[].image`
- Output format: PNG
- Result URL lifetime: ~24 hours (persist immediately if you need durable access)

## Core Difference: Unified vs Legacy-Split Models

- Unified (new): `qwen-image-2.0`, `qwen-image-2.0-pro`
  - Same model IDs support both text-to-image and image editing.
- Legacy split:
  - Generation: `qwen-image-max`, `qwen-image-plus`, `qwen-image`
  - Editing: `qwen-image-edit-max`, `qwen-image-edit-plus`, `qwen-image-edit`

## Model Capability Matrix

| Model | Generation | Editing | Images per request (`n`) | Size behavior | Async |
|---|---|---|---|---|---|
| `qwen-image-2.0-pro` | Yes | Yes | 1..6 | total pixels in `[512*512, 2048*2048]` | No |
| `qwen-image-2.0` | Yes | Yes | 1..6 | total pixels in `[512*512, 2048*2048]` | No |
| `qwen-image-max` | Yes | No | fixed `1` | preset aspect-ratio sizes | No |
| `qwen-image-plus` | Yes | No | fixed `1` | generation presets | Yes |
| `qwen-image` | Yes | No | fixed `1` | generation presets | Yes |
| `qwen-image-edit-max` | No | Yes | 1..6 | width/height each in `[512, 2048]` | No |
| `qwen-image-edit-plus` | No | Yes | 1..6 | width/height each in `[512, 2048]` | No |
| `qwen-image-edit` | No | Yes | fixed `1` | non-customizable size | No |

## Request Pattern Differences

Text-to-image pattern:
- One `user` message
- `content` contains exactly one `{ "text": "..." }`

Image-edit pattern:
- One `user` message
- `content` contains `1..3` `{ "image": "<url-or-base64>" }`
- Plus exactly one `{ "text": "edit instruction" }`

Shared key params:
- `negative_prompt` (max 500 chars)
- `prompt_extend` (default `true`)
- `watermark` (default `false`)
- `seed` in `[0, 2147483647]`

## Practical Model Selection

- Choose `qwen-image-2.0-pro` for highest quality in both generation and editing.
- Choose `qwen-image-2.0` for better speed/cost balance while keeping unified model wiring.
- Keep `qwen-image-max` only when you specifically want max-line generation behavior and fixed single output.
- Keep `qwen-image-edit-max` only when you specifically want max-line editing behavior.
- Use `qwen-image-plus` / `qwen-image` only if async text-to-image is required.

## Addreams Wiring Recommendations

- Prefer unified 2.0 IDs for new work:
  - Generation default: `qwen-image-2.0`
  - Premium toggle: `qwen-image-2.0-pro`
  - Editing default: `qwen-image-2.0`
  - Premium toggle: `qwen-image-2.0-pro`
- Validate payload shape by operation (generation vs edit), even when model ID is the same.
- Normalize upstream errors using `request_id`, `code`, and `message`.
- Store generated images in durable storage if URLs must remain valid after 24h.

## Detailed References In This Repo

- [Qwen-Image-2.0.md](/Users/Duncan/Desktop/addreams/docs/qwen-api/Qwen-Image-2.0.md)
- [Qwen-Image-2.0-Pro.md](/Users/Duncan/Desktop/addreams/docs/qwen-api/Qwen-Image-2.0-Pro.md)
- [Qwen-Image-Edit-2.0.md](/Users/Duncan/Desktop/addreams/docs/qwen-api/Qwen-Image-Edit-2.0.md)
- [Qwen-Image-Edit-2.0-Pro.md](/Users/Duncan/Desktop/addreams/docs/qwen-api/Qwen-Image-Edit-2.0-Pro.md)
- [Qwen-Image-Max.md](/Users/Duncan/Desktop/addreams/docs/qwen-api/Qwen-Image-Max.md)
- [Qwen-Image-Edit-Max.md](/Users/Duncan/Desktop/addreams/docs/qwen-api/Qwen-Image-Edit-Max.md)
