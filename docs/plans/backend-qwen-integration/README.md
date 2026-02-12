# Backend Qwen Integration Plan Pack

Last updated: 2026-02-12

## Goal

Ship real Qwen image generation and image editing in the backend, deploy it on Cloudflare Workers, and verify end-to-end behavior from frontend to backend.

## Scope For This Plan Pack

1. `qwen-image-max` integration for text-to-image.
2. `qwen-image-edit-max` integration for image editing.
3. Backend route wiring, validation, error mapping, and deployment runbook.
4. Frontend-to-backend API path verification through the existing `/api/*` proxy.

## Explicitly Out Of Scope Here

1. Video generation workflow integration.
2. New data/storage resources (D1, R2, Queues, Durable Objects).
3. Post-MVP infra hardening work.

## Document Map

1. `docs/plans/backend-qwen-integration/01-qwen-backend-roadmap.md`
   - Staged implementation sequence for Qwen image APIs.
2. `docs/plans/backend-qwen-integration/02-qwen-wiring-decisions.md`
   - Locked decisions for this sprint and what is intentionally deferred.
3. `docs/plans/backend-qwen-integration/03-deploy-runbook.md`
   - Repo-specific deploy and verification checklist.

## Where Deferred Infra Planning Lives

1. `docs/plans/cloudflare-infra/README.md`
2. `docs/plans/cloudflare-infra/01-post-qwen-infra-sprint.md`

## Primary References

1. `docs/qwen-api/Qwen-Image-Max.md`
2. `docs/qwen-api/Qwen-Image-Edit-Max.md`
3. https://developers.cloudflare.com/workers/runtime-apis/fetch/
4. https://developers.cloudflare.com/workers/configuration/secrets/
5. https://developers.cloudflare.com/workers/observability/logs/tail-workers/
