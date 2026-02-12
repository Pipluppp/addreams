# 05 - Qwen Parameter Component Matrix

## Objective
Map Qwen API parameters to explicit frontend components for both workflows.

## Product Shoots (Qwen-Image-Max)
| Parameter | UI Component | Type | Validation | Default | Phase |
|---|---|---|---|---|---|
| `prompt` | `PromptTextarea` | string | required, non-empty | empty | now |
| `negative_prompt` | `NegativePromptTextarea` | string | optional, length guard | empty | now |
| `size` | `SizePresetSelect` | enum string | fixed preset list | `1328*1328` | now |
| `n` | hidden constant | integer | forced `1` | `1` | now |
| `seed` | `SeedInput` | integer | `0..2147483647` | unset | now |
| `prompt_extend` | `PromptExtendToggle` | boolean | boolean | `true` | now |
| `watermark` | `WatermarkToggle` | boolean | boolean | `false` | now |
| `output_format` | `OutputFormatSelect` | enum string | `png|jpg` | `png` | now |
| `response_format` | hidden advanced (future) | enum string | `url|b64_json` | `url` | later |

## Ad Graphics (Qwen-Image-Edit-Max)
| Parameter | UI Component | Type | Validation | Default | Phase |
|---|---|---|---|---|---|
| `image` content | `ReferenceImageInputTabs` + `ImageDropzone` | file/url | type + size limits | empty | now |
| instruction `text` | `EditInstructionTextarea` | string | required, non-empty | empty | now |
| `negative_prompt` | `NegativePromptTextarea` | string | optional, length guard | empty | now |
| `size` | `SizePresetSelect` | enum/custom | preset or bounded custom | preserve aspect/preset | now |
| `n` | hidden constant | integer | initial MVP `1` | `1` | now |
| `seed` | `SeedInput` | integer | `0..2147483647` | unset | now |
| `prompt_extend` | `PromptExtendToggle` | boolean | boolean | `true` | now |
| `watermark` | `WatermarkToggle` | boolean | boolean | `false` | now |

## Shared Parameter Component Backlog
1. `ParameterPanel` (common wrapper for advanced controls).
2. `ParamPresetChips` (quick style/size presets).
3. `RequestPayloadPreview` (dev-only debug panel).
4. `RevisedPromptDisplay` (for future upstream response fields).

## Payload Strategy (Stub Phase)
1. Frontend sends Qwen-ready field names in request body.
2. Backend stub accepts required MVP fields and safely ignores unhandled fields.
3. Frontend stores submitted payload locally to allow re-run once real API is connected.
