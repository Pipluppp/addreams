# History Assets R2 Integration Task (2026-02-17)

## Objective

Ensure history entries can reliably render both:

- Input reference image (when applicable)
- Generated output image

by persisting assets in Cloudflare R2 and serving them through authenticated backend routes.

## Current State

- History metadata is stored in D1 (`generation` table).
- Generated output images are designed to use `GENERATIONS_BUCKET` when configured.
- Your Cloudflare account does not yet have the R2 bucket created for this flow.
- Frontend history view currently focuses on a single asset preview path and needs explicit input/output wiring.

## Infra Tasks (Cloudflare Account)

1. Create R2 buckets.
- Recommended names:
- `addreams-generations-prod`
- `addreams-generations-dev`

2. Add R2 binding to backend Worker config.
- File: `backend/wrangler.jsonc`
- Binding name: `GENERATIONS_BUCKET`
- Point production Worker to `addreams-generations-prod`.

3. Add local/dev binding config.
- Ensure local/dev runs bind `GENERATIONS_BUCKET` to `addreams-generations-dev`.
- Confirm `wrangler dev` can read/write test objects.

4. Document bucket naming and binding policy.
- Keep a short runbook note in deployment docs to avoid drift between environments.

## Backend Development Tasks

1. Persist generated outputs to R2 with stable key format.
- Example prefix: `users/{userId}/generations/{generationId}/output.{ext}`.

2. Persist input reference images (for reference-based workflows) to R2.
- Support both:
- `http(s)` input URLs
- upload-based data URLs
- Example prefix: `users/{userId}/generations/{generationId}/input.{ext}`.

3. Extend history mapping response model.
- Include distinct fields for output and input asset retrieval URLs.
- Keep owner-scoped access and avoid exposing raw public bucket URLs.

4. Add authenticated asset endpoints.
- Output route:
- `GET /api/history/:id/asset`
- Input route:
- `GET /api/history/:id/input-asset`
- Both must verify session ownership before returning bytes.

5. Deletion behavior.
- On history delete, remove both input and output R2 objects (if present).

6. Failure semantics.
- If R2 upload fails after generation success, decide policy:
- mark record failed + refund, or
- keep success with fallback provider URL and log warning.
- Document the chosen policy in `history-gen/README.md`.

## Frontend Development Tasks

1. Update history API typing.
- Add `inputAssetUrl` (or equivalent) alongside existing output asset URL fields.

2. Update history list/detail UI.
- Keep output image preview in list rows.
- In detail view, render:
- input reference preview (when available)
- generated output preview

3. Add robust fallback handling.
- If input/output asset URL is missing, render clear empty state text.
- Keep failed generation cards readable without broken image UI.

4. Keep rendering owner-scoped.
- Use backend history asset endpoints only (no direct public R2 links).

## Verification Checklist

1. Infra verification.
- Bucket exists in Cloudflare dashboard.
- `GENERATIONS_BUCKET` binding present in deployed Worker.

2. End-to-end (reference workflow).
- Generate from reference image.
- Confirm both input and output objects exist in R2 under expected keys.
- Confirm history detail renders both images.

3. End-to-end (text workflow).
- Generate from text prompt.
- Confirm output object exists and renders in history.

4. Authz checks.
- User A cannot fetch User B asset routes.
- Missing/invalid session returns `401`.

5. Deletion checks.
- Deleting history item removes D1 record and associated R2 objects.

## Suggested Sequence

1. Provision Cloudflare R2 buckets and backend binding.
2. Implement backend dual-asset persistence + endpoints.
3. Update frontend history rendering/types.
4. Run typecheck/build and manual E2E verification.
5. Update deployment docs with final bucket/binding values.
