# 05 - Ad Graphics Step Flow

Last updated: 2026-02-12
Status: Finalized (aligned to docs/design.md)

## Objective
Define the final step-based UX for Ad Graphics (`image + instructions -> edited image`).

## Design Linkage
1. Aligns with `docs/design.md` sections 7 and 8.
2. Validation UX and state handling must align with `docs/design.md` section 8.

## Step Breakdown
1. Step 1 - Reference Input
   - source mode: Upload or URL
   - upload dropzone or URL input
   - reference preview
2. Step 2 - Edit Brief
   - instruction textarea
   - positional guidance copy
3. Step 3 - Creative Controls
   - negative prompt
   - size preset or custom size mode
4. Step 4 - Advanced
   - seed
   - prompt_extend
   - watermark
5. Step 5 - Review and Generate
   - payload summary
   - validation summary
   - generate action
6. Step 6 - Result and Iterate
   - result frame
   - request metadata
   - swap image / rerun actions

## Validation Model
1. Require one valid image source.
2. Validate upload format and size (`<= 10MB`).
3. Require non-empty instruction text.
4. Seed range and integer checks.
5. Custom size must follow width/height/product bounds rules.

## Submission Contract
1. Endpoint: `POST /api/workflows/image-from-reference`.
2. Payload: Qwen-Image-Edit-Max-ready structure.
3. Backend: stub compatibility maintained.
