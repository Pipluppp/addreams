# 02 - Product Shoots Plan (Text to Image)

Status: Completed on 2026-02-12.

## Objective
Deliver a full Product Shoots workflow for text-only generation, ready for Qwen-Image-Max backend integration.

## Primary User Outcome
User writes a prompt, configures generation parameters, submits, and sees result cards + request metadata.

## API Target (Current Phase)
1. Submit to stub endpoint: `POST /api/workflows/image-from-text`.
2. Keep client payload shape Qwen-ready (superset allowed), with backend ignoring extras for now.
3. Contract owner is Hono backend route handler in `backend/src/index.ts`.

## UI Component Requirements
1. Prompt editor block.
   - `PromptTextarea`
   - character counter with soft warning threshold
2. Advanced options accordion.
   - `NegativePromptTextarea`
   - `SizePresetSelect` (fixed presets)
   - `SeedInput` (integer, optional)
   - `PromptExtendToggle`
   - `WatermarkToggle`
   - `OutputFormatSelect` (`png`/`jpg`)
3. Submission controls.
   - `GenerateButton`
   - loading and disabled states
4. Result area.
   - `GenerationResultFrame`
   - metadata chips (`workflow`, `requestId`, `receivedAt`)
   - empty/loading/error variants

## Validation Rules (Frontend)
1. `prompt` required and non-empty.
2. `negative_prompt` optional, with max length guard per docs.
3. `size` must match allowed preset list.
4. `seed` integer in `[0, 2147483647]` if provided.
5. `n` forced to `1` in client payload.

## Task Checklist
1. Build page: `frontend/src/routes/studio/product-shoots.tsx`.
2. Build form schema/type in `frontend/src/features/product-shoots/schema.ts`.
3. Build reusable controls in `frontend/src/features/parameters/`.
4. Add submit mutation + optimistic request state.
5. Render stub response and preserve last successful request locally.
6. Add "Reuse settings" action to repopulate form.

## Acceptance Criteria
1. User can submit valid form and receive stub `202` response.
2. Invalid form states show inline errors and block submit.
3. Advanced parameter controls map 1:1 to planned Qwen fields.
