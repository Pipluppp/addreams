# 04 - Product Shoots Step Flow

Last updated: 2026-02-12
Status: Finalized (aligned to docs/design.md)

## Objective
Define the final step-based UX for Product Shoots (`text -> image`).

## Design Linkage
1. Aligns with `docs/design.md` sections 7 and 8.
2. Form states and submit/review patterns must follow `docs/design.md` section 8.

## Step Breakdown
1. Step 1 - Brief
   - prompt textarea
   - prompt helper examples
2. Step 2 - Inputs
   - size preset
   - output format
3. Step 3 - Creative Controls
   - negative prompt
4. Step 4 - Advanced Controls
   - seed
   - prompt_extend
   - watermark
5. Step 5 - Review and Generate
   - payload summary card
   - validation summary
   - generate action
6. Step 6 - Result and Iterate
   - output placeholder/result frame
   - metadata chips
   - reuse/regenerate actions

## Validation Model
1. `prompt` required.
2. `negative_prompt` optional with length guard.
3. `size` must be in allowed list.
4. `seed` optional integer in valid range.
5. `output_format` must be one of supported values.
6. `n` fixed to `1` in payload.

## Submission Contract
1. Endpoint: `POST /api/workflows/image-from-text`.
2. Payload: Qwen-Image-Max-ready structure.
3. Backend: stub accepts required fields and ignores extras.
