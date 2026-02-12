# 07 - Hono API Contract Alignment

## Objective
Make frontend planning explicit about the current backend implementation: Cloudflare Worker with Hono in `backend/src/index.ts`.

## Why Hono Context Matters
1. Frontend integration is contract-driven by HTTP route shape, payload validation, and error responses.
2. Those contracts are currently implemented in Hono handlers, not in a separate OpenAPI spec yet.
3. Without explicit alignment, frontend can drift from actual runtime behavior.

## Current Stub Endpoints (Source: `backend/src/index.ts`)
1. `GET /api/health`
   - `200`: `{ status, service, timestamp }`
2. `POST /api/workflows/image-from-text`
   - requires: `prompt`
   - `202`: `{ workflow, status: \"stub\", requestId, receivedAt }`
3. `POST /api/workflows/image-from-reference`
   - requires: `prompt`, `referenceImageUrl`
   - `202`: `{ workflow, status: \"stub\", requestId, receivedAt }`
4. `POST /api/workflows/video-from-reference`
   - requires: `prompt`, `referenceImageUrl`
   - `202`: `{ workflow, status: \"stub\", requestId, receivedAt }`

## Error Shape Baseline
1. Validation errors: `400` with `{ error: string }`.
2. Not found: `404` with `{ error: \"Not found\" }`.
3. Unhandled errors: `500` with `{ error, detail }`.

## Frontend Contract Rules
1. Centralize all request/response types in `frontend/src/lib/api.ts` (or feature API modules).
2. Do not parse raw JSON directly in page components.
3. Normalize Hono error payloads into user-facing error messages in one place.
4. Keep request DTOs Qwen-ready, but ensure required Hono stub fields are always present.

## Change Management
1. Any backend Hono route contract change requires matching frontend type/update in the same PR.
2. Add a small contract smoke test checklist to PR description:
   - `GET /api/health`
   - `POST /api/workflows/image-from-text`
   - `POST /api/workflows/image-from-reference`
