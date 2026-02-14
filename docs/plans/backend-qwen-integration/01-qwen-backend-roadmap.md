# Qwen Backend Roadmap (Image APIs Only)

Last updated: 2026-02-14

## Objective

Replace workflow stubs in `backend/src/index.ts` with real Qwen calls while keeping the first release stateless (no database, no object storage).

## In-Scope Routes

1. `POST /api/workflows/image-from-text` -> `qwen-image-max`
2. `POST /api/workflows/image-from-reference` -> `qwen-image-edit-max`
3. `GET /api/health` remains unchanged

## Out-Of-Scope Routes

1. `POST /api/workflows/video-from-reference` remains stub/deferred

## Sprint Constraints

1. No R2 persistence; return temporary provider URL directly.
2. No D1 and no Drizzle runtime integration.
3. No queue/retry worker; one request in, one upstream call out.

## Phase Plan

## Phase 0: Contract Freeze

1. Lock official model defaults:
   - `qwen-image-max`
   - `qwen-image-edit-max`
2. Lock backend env contract:
   - `QWEN_API_KEY` (required secret)
   - `QWEN_REGION` (`sg` or `bj`, default `sg`)
   - `QWEN_IMAGE_MODEL` (optional override)
   - `QWEN_IMAGE_EDIT_MODEL` (optional override)
   - `QWEN_TIMEOUT_MS` (optional; default `45000`)
3. Freeze normalized backend response shape and error shape.

Exit criteria:
1. Decisions doc is accepted.
2. Quirks/mapping doc is accepted.

## Phase 1: Request Validation Layer

1. Add boundary validation with Zod for both routes.
2. Support current frontend payload envelope and normalize to internal DTO.
3. Reject invalid payloads with deterministic `400` errors.

Exit criteria:
1. Invalid payloads do not hit upstream.
2. Validation error shape is stable.

## Phase 2: Qwen Adapter + Text Route

1. Build shared DashScope adapter (`fetch` wrapper, headers, timeout, error parser).
2. Wire `image-from-text` route to official sync endpoint.
3. Parse and return image URL from `output.choices[0].message.content[0].image`.

Exit criteria:
1. Route returns `200` with real generated URL.
2. Route returns provider-aware error payload for upstream failures.

## Phase 3: Edit Route

1. Wire `image-from-reference` to `qwen-image-edit-max`.
2. Normalize single-image input now (multi-image deferred at public API layer).
3. Parse and return all images from `output.choices[0].message.content[].image`.

Exit criteria:
1. Route returns `200` with at least one image URL.
2. URL/Base64 reference input both work.

## Phase 4: Deploy + End-To-End Verification

1. Deploy backend then frontend.
2. Verify:
   - backend direct route
   - frontend proxy route
   - error path behavior
3. Keep `video-from-reference` explicitly stubbed.

Exit criteria:
1. Non-stub responses from both image routes.
2. No CORS/proxy regressions.

## Success Criteria (MVP)

1. User submits prompt in frontend and receives real generated image URL.
2. User submits reference image + edit prompt and receives real edited image URL.
3. Every successful response includes backend `requestId` and provider `request_id`.
4. Provider temporary URL behavior (24h) is documented and visible in response metadata.

## Deferred To Next Sprint

1. R2 persistence for durable image URLs.
2. D1 + Drizzle for job history/audit.
3. Queue-based retries/background processing.
4. Service binding hardening between frontend and backend Workers.
