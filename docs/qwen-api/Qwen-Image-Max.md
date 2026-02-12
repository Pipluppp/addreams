# Qwen-Image-Max API Reference (DashScope)

Source docs (Alibaba Cloud Model Studio):
- https://www.alibabacloud.com/help/en/model-studio/qwen-image-api
- https://www.alibabacloud.com/help/en/model-studio/models

Doc page last updated: `2026-02-02` (per source page).

## Model IDs

- `qwen-image-max-latest` (dynamic alias, default recommended in docs)
- `qwen-image-max-2025-01-23` (fixed snapshot)

## Endpoint

Image generation endpoint:

- China (Beijing): `POST https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis`
- Singapore: `POST https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis`

OpenAI-compatible endpoint:

- China (Beijing): `POST https://dashscope.aliyuncs.com/compatible-mode/v1/images/generations`
- Singapore: `POST https://dashscope-intl.aliyuncs.com/compatible-mode/v1/images/generations`

## Authentication Headers

- `Authorization: Bearer $DASHSCOPE_API_KEY`
- `Content-Type: application/json`

## Request Body (native DashScope endpoint)

```json
{
  "model": "qwen-image-max-latest",
  "input": {
    "messages": [
      {
        "role": "user",
        "content": [
          { "type": "text", "text": "Prompt text here" }
        ]
      }
    ]
  },
  "parameters": {
    "size": "1328*1328",
    "n": 1,
    "seed": 123456,
    "prompt_extend": true,
    "watermark": false,
    "response_format": "url",
    "output_format": "png",
    "negative_prompt": "optional negative prompt"
  }
}
```

## Input Parameters

### Required

- `model` (`string`)
- `input.messages` (`array`)
- `input.messages[].role` (`system | user`)
- `input.messages[].content[]` (`array`)
- `input.messages[].content[].type` (`text` or `image`)
  - For text prompts: use `{"type":"text","text":"..."}`
  - For image content: use `{"type":"image","image":"<url>"}` when needed by the doc schema

### Optional (`parameters`)

- `size` (`string`, default `1328*1328`)
  - Allowed fixed sizes: `1664*928`, `1472*1140`, `1328*1328`, `1140*1472`, `928*1664`
- `n` (`integer`, default `1`)
  - `qwen-image-max` supports only `1` (doc explicitly states this)
- `seed` (`integer`, optional)
  - Range: `[0, 2147483647]`
- `prompt_extend` (`boolean`, default `true`)
  - Enables automatic prompt rewrite/extension
- `watermark` (`boolean`, default `false`)
- `response_format` (`string`, default `url`)
  - `url` or `b64_json`
- `output_format` (`string`, default `png`)
  - `png` or `jpg`
- `negative_prompt` (`string`, optional)

### Prompt Length Limits

For `qwen-image-max`:
- `prompt` length: up to 500 Chinese characters
- `negative_prompt` length: up to 500 Chinese characters

## Synchronous Response Schema

```json
{
  "output": {
    "task_id": "string",
    "task_status": "SUCCEEDED",
    "submit_time": "1739792455172",
    "scheduled_time": "1739792455173",
    "end_time": "1739792468852",
    "results": [
      {
        "orig_prompt": "original prompt",
        "revised_prompt": "rewritten prompt",
        "url": "https://..."
      }
    ]
  },
  "usage": {
    "image_count": 1
  },
  "request_id": "string"
}
```

Notes:
- If `response_format = b64_json`, each result includes `b64_json` instead of URL.
- Async task query examples in the same docs may return the rewritten prompt as `actual_prompt`.
- Generated URL validity in docs: about 24 hours.

## Error Response Schema

```json
{
  "code": "InvalidApiKey",
  "message": "Invalid API-key provided.",
  "request_id": "string"
}
```

Common HTTP statuses listed by docs include `400`, `401`, `403`, `404`, `413`, `500`.

## Async Mode Support (Important)

The same API reference has an async mode (`"parameters": { "async": "enable" }` + `GET /api/v1/tasks/{task_id}`), but docs explicitly limit that async flow to:
- `qwen-image-plus`
- `qwen-image`

For backend integration with `qwen-image-max`, treat synchronous mode as the supported path.

## Backend Integration Notes

- Keep `n=1` for `qwen-image-max`; validate this before calling upstream.
- Persist generated URLs to R2 immediately; returned URLs are temporary.
- Store both `orig_prompt` and rewritten prompt (`revised_prompt` / `actual_prompt`) for traceability.
- Expose `seed` and `prompt_extend` in internal API DTOs so behavior is reproducible and controllable.
