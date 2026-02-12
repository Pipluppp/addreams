# Qwen-Image-Edit-Max API Reference (DashScope)

Source docs (Alibaba Cloud Model Studio):
- https://www.alibabacloud.com/help/en/model-studio/qwen-image-edit-api
- https://www.alibabacloud.com/help/en/model-studio/models

Doc page last updated: `2026-02-09` (per source page).

## Model IDs

- `qwen-image-edit-max-latest` (dynamic alias, default recommended in docs)
- `qwen-image-edit-max-2025-01-23` (fixed snapshot)

## Endpoint

Image editing endpoint:

- China (Beijing): `POST https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation`
- Singapore: `POST https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation`

OpenAI-compatible endpoint:

- China (Beijing): `POST https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions`
- Singapore: `POST https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions`

## Authentication Headers

- `Authorization: Bearer $DASHSCOPE_API_KEY`
- `Content-Type: application/json`

## Request Body (native DashScope endpoint)

```json
{
  "model": "qwen-image-edit-max-latest",
  "input": {
    "messages": [
      {
        "role": "user",
        "content": [
          { "type": "image", "image": "https://example.com/source.png" },
          { "type": "text", "text": "Editing instructions here" }
        ]
      }
    ]
  },
  "parameters": {
    "n": 1,
    "negative_prompt": "optional negative prompt",
    "size": "1328*1328",
    "prompt_extend": true,
    "watermark": false,
    "seed": 123456
  }
}
```

## Input Parameters

### Required

- `model` (`string`)
- `input.messages` (`array`)
- `input.messages[].role` (docs show `user`)
- `input.messages[].content[]` (`array`)
  - `image` objects: `{"type":"image","image":"..."}`
  - one `text` instruction object: `{"type":"text","text":"..."}`

### Image Input Rules

- Accepted formats: `JPG`, `JPEG`, `PNG`, `BMP`, `WEBP`, `TIFF`, `GIF`
- Max size per image: `10 MB`
- Recommended resolution: between `384x384` and `3072x3072`
- GIF support uses the first frame only
- `image` value can be URL, Base64 string, or local file path (SDK scenarios)

Note on count limits in current docs:
- Model overview text says up to `6` images.
- Request parameter table currently states `1` to `3` images in `content`.
- For backend safety, enforce `<=3` unless Alibaba updates this API schema.

### Prompting Guidance (from docs)

- With multiple images, reference order explicitly (`first image`, `second image`, etc.).
- For local edits, describe location precisely (`top-left`, `background`, `logo area`).
- For text edits inside an image, specify target text and location.

### Optional (`parameters`)

- `n` (`integer`, default `1`, range `1-4`)
- `negative_prompt` (`string`, optional)
- `size` (`string`, optional)
  - If omitted, output keeps source aspect ratio.
  - If multiple images are provided, ratio follows the last input image.
  - Supported fixed values include `1664*928`, `1472*1140`, `1328*1328`, `1140*1472`, `928*1664`.
  - Custom size rules:
    - Width and height each in `[512, 2048]`
    - `width * height` in `[262144, 4194304]`
    - Values should be multiples of `16` (non-multiples are rounded to nearest multiple)
- `prompt_extend` (`boolean`, default `true`)
- `watermark` (`boolean`, default `false`)
- `seed` (`integer`, range `[0, 2147483647]`)

## Response Schema

```json
{
  "output": {
    "choices": [
      {
        "message": {
          "content": [
            {
              "type": "image",
              "image_url": {
                "url": "https://..."
              }
            }
          ],
          "role": "assistant"
        }
      }
    ]
  },
  "usage": {
    "total_tokens": 1045,
    "image_tokens": 1045
  },
  "request_id": "string"
}
```

Notes:
- Output format for this model is `png` (per model overview).
- Generated image URLs are temporary (docs indicate about 24 hours).

## Error Response Schema

```json
{
  "code": "InvalidApiKey",
  "message": "Invalid API-key provided.",
  "request_id": "string"
}
```

## Async Support

Current image-edit API reference shows synchronous generation flow on this endpoint.
In the official SDK notes for this page, async APIs are explicitly marked as not supported.

## Backend Integration Notes

- Validate content contract as exactly: one instruction text + image inputs.
- Apply server-side image prechecks (format, size, resolution) before sending upstream.
- Normalize and validate `size` with the documented bounds and multiple-of-16 behavior.
- Persist generated image URLs to R2 quickly because links are temporary.
- Record `seed`, `prompt_extend`, and final upstream request payload for reproducibility.

