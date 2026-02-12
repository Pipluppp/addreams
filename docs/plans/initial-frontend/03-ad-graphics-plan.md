# 03 - Ad Graphics Plan (Image Editing)

Status: Completed on 2026-02-12.

## Objective
Deliver image-edit workflow UI for Ad Graphics, aligned with Qwen-Image-Edit-Max input model.

## Primary User Outcome
User uploads or references an image, writes edit instructions, configures params, submits, and reviews output metadata.

## API Target (Current Phase)
1. Submit to stub endpoint: `POST /api/workflows/image-from-reference`.
2. Keep payload shaped for future Qwen-Image-Edit-Max call.
3. Contract owner is Hono backend route handler in `backend/src/index.ts`.

## UI Component Requirements
1. Image input section.
   - `ReferenceImageInputTabs` (`Upload` | `URL`)
   - `ImageDropzone`
   - `ImagePreviewCard`
2. Instruction section.
   - `EditInstructionTextarea`
   - helper text for positional instructions
3. Advanced parameter section.
   - `NegativePromptTextarea`
   - `SizePresetSelect` + optional custom size mode (future gated)
   - `SeedInput`
   - `PromptExtendToggle`
   - `WatermarkToggle`
4. Results section.
   - `EditedImageResultFrame`
   - request metadata and validation summary

## Validation Rules (Frontend)
1. Require one image source (`upload` or `url`) + instruction prompt.
2. Validate upload type: `jpg|jpeg|png|bmp|webp|tiff|gif`.
3. Validate upload size: max `10MB`.
4. Validate `seed` integer range `[0, 2147483647]`.
5. Validate custom `size` rules when enabled:
   - width/height each `512-2048`
   - product bounds per docs
   - multiples of `16`

## Task Checklist
1. Build page: `frontend/src/routes/studio/ad-graphics.tsx`.
2. Build input adapters for `File` and URL sources.
3. Add client-side image precheck utility in `frontend/src/lib/image-validation.ts`.
4. Implement mutation submit flow and result rendering.
5. Add "swap image" and "clear form" actions.
6. Add instructional microcopy for better prompt quality.

## Acceptance Criteria
1. Image input UX works for both upload and URL modes.
2. Invalid files are rejected before API request.
3. Submit path works with stub backend and shows structured response.
