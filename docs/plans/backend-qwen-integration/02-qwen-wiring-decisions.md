# Qwen Wiring Decisions (Current Sprint)

Last updated: 2026-02-12

## Decision Summary

1. Integrate official Qwen APIs now for image generation and image editing.
2. Do not implement video generation in this sprint.
3. Deploy and verify with current two-Worker architecture (frontend proxy -> backend API).
4. Defer Cloudflare infra expansion (R2, D1, Queues) to a separate sprint.

## Locked Scope

1. In scope:
   - `POST /api/workflows/image-from-text`
   - `POST /api/workflows/image-from-reference`
2. Out of scope:
   - `POST /api/workflows/video-from-reference`
   - persistent storage/history pipeline
   - asynchronous queue processing

## API Behavior Decisions

1. Backend remains the only place that holds Qwen API credentials.
2. Frontend should keep calling same-origin `/api/*` paths.
3. Response contract should include:
   - backend request ID
   - upstream/provider request ID
   - generated output URL(s) or payload
   - model used
4. Validation failures return `400`; upstream/provider failures map to backend `5xx` with safe error payloads.

## Deployment Decisions

1. Keep manual Wrangler deploy flow from repo scripts.
2. Require a post-deploy smoke test for:
   - backend health
   - frontend root
   - frontend proxied health
   - both workflow routes
3. Use `wrangler tail` during verification when debugging route and upstream behavior.

## Deferred To Infra Sprint

1. R2 output persistence for durable media URLs.
2. D1 workflow history/audit/billing data.
3. Queues for async retries/background workflows.
4. Service binding migration for frontend->backend calls (optional hardening).

## References

1. `docs/qwen-api/Qwen-Image-Max.md`
2. `docs/qwen-api/Qwen-Image-Edit-Max.md`
3. https://developers.cloudflare.com/workers/runtime-apis/fetch/
4. https://developers.cloudflare.com/workers/configuration/secrets/
5. https://developers.cloudflare.com/workers/wrangler/commands/#deploy
