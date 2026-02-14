# Backend Qwen Integration Plan Pack

Last updated: 2026-02-14

## Goal

Deliver a working backend workflow on Hono + Cloudflare Workers that calls official Qwen image APIs and returns generated image URLs to the frontend.

## Scope Of This Plan Pack

1. Wire `qwen-image-max` for text-to-image.
2. Wire `qwen-image-edit-max` for image editing (single reference image flow first).
3. Define request validation, error mapping, and route contracts for current frontend integration.
4. Ship deploy + smoke-test runbook for production verification.

## Constraints For This Sprint

1. No R2, D1, Queues, Durable Objects, or workflow persistence.
2. No database/ORM work in the runtime path.
3. Keep the existing frontend `/api/*` proxy architecture.
4. Keep `video-from-reference` as deferred stub.

## Document Map

1. `docs/plans/backend-qwen-integration/00-qwen-account-and-api-key-setup.md`
   - One-time Alibaba Model Studio setup for this repo (API key, region, env/secrets).
2. `docs/plans/backend-qwen-integration/01-qwen-backend-roadmap.md`
   - Phase-by-phase implementation order and acceptance gates.
3. `docs/plans/backend-qwen-integration/02-qwen-wiring-decisions.md`
   - Locked technical decisions (`Zod now`, `Drizzle deferred`, contract shape, error policy).
4. `docs/plans/backend-qwen-integration/03-deploy-runbook.md`
   - Deploy checklist and smoke tests for backend + frontend proxy path.
5. `docs/plans/backend-qwen-integration/04-qwen-wiring-quirks-and-mapping.md`
   - Official API quirks and repo-specific payload translation matrix.

## Source Of Truth References

1. `docs/qwen-api/Qwen-Image-Max.md`
2. `docs/qwen-api/Qwen-Image-Edit-Max.md`
3. `backend/src/index.ts`
4. https://developers.cloudflare.com/workers/runtime-apis/fetch/
5. https://developers.cloudflare.com/workers/configuration/secrets/
6. https://developers.cloudflare.com/workers/observability/logs/tail-workers/

## Deferred Infra Planning

1. `docs/plans/cloudflare-infra/README.md`
2. `docs/plans/cloudflare-infra/01-post-qwen-infra-sprint.md`
