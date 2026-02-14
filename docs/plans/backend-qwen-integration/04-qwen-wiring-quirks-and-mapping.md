# Qwen Wiring Quirks And Mapping

Last updated: 2026-02-14

## Purpose

Capture the non-obvious API quirks and current repo mismatches that must be handled so backend wiring works on first pass.

## Official Qwen API Quirks We Must Respect

1. `qwen-image-max` is synchronous-only and `n` is fixed to `1`.
2. `qwen-image-edit-max` is synchronous-only in this API and supports `n: 1..6`.
3. Text/image content items use short form objects (`{ "text": "..." }`, `{ "image": "..." }`) without a required `type` field.
4. Region is strict:
   - Singapore key + Singapore endpoint
   - Beijing key + Beijing endpoint
5. Output URLs are temporary (about 24 hours) and must be persisted externally later if durability is needed.
6. `qwen-image-max` supports only specific size presets.
7. `qwen-image-edit-max` supports custom `size` with model constraints.

## Current Repo Mismatch Matrix

| Area | Current State | Impact | Action In This Sprint |
|---|---|---|---|
| Frontend model IDs | Sends `image-generation-latest` / `image-edit-latest` | Not official model IDs | Ignore client model and force server env model |
| Frontend content parts | Sends `{ type, text/image }` | Not official request shape | Strip `type` and forward short form |
| Frontend output params | Sends `output_format` / `response_format` | Not supported for these sync routes | Drop fields before upstream call |
| Frontend size presets | Uses `1472*1140` and `1140*1472` | Invalid for official `qwen-image-max` docs | Remap to `1472*1104` / `1104*1472` for compatibility |
| Frontend prompt max constant | `MAX_PROMPT_LENGTH = 500` | Overly restrictive vs official 800 | Keep for now, document as frontend UX constraint |
| Backend env sample | Uses lowercase official model IDs | Aligned with official docs | Keep as-is (`qwen-image-max`, `qwen-image-edit-max`) |
| Backend bindings | Missing `QWEN_IMAGE_EDIT_MODEL` binding | Cannot cleanly configure edit model | Add binding in backend type/env contract |
| Current routes | Return only stub response | No live generation | Replace stubs with Qwen adapter |

## Translation Rules (Incoming Request -> Qwen Request)

## Rule Set A: `POST /api/workflows/image-from-text`

1. Accept either:
   - minimal API shape (`prompt`, `size`, `negativePrompt`, etc.)
   - current frontend envelope (`input.messages`, `parameters`, `model`)
2. Resolve prompt from:
   - `prompt`, else fallback to first text content item.
3. Build Qwen body:
   - `model`: backend-configured `qwen-image-max` value
   - `input.messages[0].content`: exactly one `{ "text": "..." }`
   - `parameters.n = 1` (hard-enforced)
4. Drop unsupported keys from incoming payload:
   - `output_format`
   - `response_format`
   - any client `model` override

## Rule Set B: `POST /api/workflows/image-from-reference`

1. Accept either:
   - `referenceImageUrl` + `prompt`
   - current frontend envelope with content parts
2. Build Qwen body:
   - first image: `{ "image": "<url-or-base64>" }`
   - one text item: `{ "text": "<prompt>" }`
3. Keep `n` within `1..6`, else reject `400`.
4. Allow `size` passthrough only when valid for edit-max constraints.

## Rule Set C: Response Normalization

1. `image-from-text`: image URL from `output.choices[0].message.content[0].image`
2. `image-from-reference`: image URLs from `output.choices[0].message.content[].image`
3. Always return:
   - backend `requestId`
   - provider `requestId`
   - `provider.model`
   - `output.images[]`
   - `usage` when present

## Error Mapping Quirks

1. Upstream validation errors are often `400` with provider `code`/`message`.
2. Backend should not leak upstream raw payload blindly.
3. Backend should preserve provider `request_id` when present for troubleshooting.
4. `DataInspectionFailed` should map to a user-safe policy error message.

## Implementation Defaults (Locked For This Sprint)

1. Keep compatibility remapping for old frontend size presets now; remove only after frontend constants are migrated.
2. Allow Base64 reference images up to provider limits, but enforce backend payload guardrails to avoid oversized requests.
3. Normalize provider-origin errors using the decisions doc policy (provider 4xx/5xx mapped to backend-safe upstream errors).
