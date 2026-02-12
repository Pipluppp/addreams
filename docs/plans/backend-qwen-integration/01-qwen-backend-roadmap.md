# Qwen Backend Roadmap (Image APIs Only)

Last updated: 2026-02-12

## Objective

Replace stub workflow responses in `backend/src/index.ts` with real upstream Qwen calls for image generation and image editing.

## Scope

1. Implement real behavior for `POST /api/workflows/image-from-text`.
2. Implement real behavior for `POST /api/workflows/image-from-reference`.
3. Keep `GET /api/health` and proxy routing stable.
4. Keep response shapes predictable for frontend consumption.

## Non-Goals In This Roadmap

1. No `video-from-reference` integration in this sprint.
2. No D1/R2/Queues provisioning in this sprint.
3. No auth/account/billing changes.

## Existing Internal Routes

1. `GET /api/health`
2. `POST /api/workflows/image-from-text`
3. `POST /api/workflows/image-from-reference`
4. `POST /api/workflows/video-from-reference` (remains stub/deferred)

## Upstream Mapping

1. `image-from-text` -> Qwen Image Max (`qwen-image-max-latest` by default)
2. `image-from-reference` -> Qwen Image Edit Max (`qwen-image-edit-max-latest` by default)

## Phase Plan

## Phase 0: Wiring Preconditions

1. Define backend env contract:
   - `QWEN_API_KEY` (secret)
   - `QWEN_IMAGE_MODEL` (optional; default to image max latest)
   - `QWEN_IMAGE_EDIT_MODEL` (optional; default to image edit max latest)
   - `QWEN_BASE_URL` (optional; default to chosen DashScope region)
2. Keep CORS middleware for `/api/*`.
3. Add request IDs and provider request ID passthrough in logs/responses.

## Phase 1: Text-to-Image Route

1. Replace stub in `/api/workflows/image-from-text` with upstream fetch.
2. Validate request payload and optional generation params.
3. Normalize upstream response to stable internal JSON shape.
4. Map upstream errors to clear backend API errors.

## Phase 2: Image-Edit Route

1. Replace stub in `/api/workflows/image-from-reference` with upstream fetch.
2. Validate prompt + reference image URL.
3. Normalize response to same internal output schema used by text-to-image.
4. Map upstream errors consistently with Phase 1.

## Phase 3: Deploy And Verify

1. Deploy backend Worker.
2. Deploy frontend Worker.
3. Validate direct backend health and frontend `/api/*` proxy path.
4. Confirm CORS behavior for intended browser call path.

## Acceptance Checks

1. `curl -i https://addreams-api.duncanb013.workers.dev/api/health`
2. `curl -i https://addreams-web.duncanb013.workers.dev/api/health`
3. Text generation request to backend route returns provider-backed response (not `status: "stub"`).
4. Image-edit request to backend route returns provider-backed response (not `status: "stub"`).
5. `video-from-reference` endpoint is still clearly marked deferred/stub.

## Deferred Work

All storage/database/queue enhancements are moved to the separate infra sprint docs under `docs/plans/cloudflare-infra/`.

## References

1. `docs/qwen-api/Qwen-Image-Max.md`
2. `docs/qwen-api/Qwen-Image-Edit-Max.md`
3. https://developers.cloudflare.com/workers/runtime-apis/fetch/
4. https://developers.cloudflare.com/workers/configuration/secrets/
