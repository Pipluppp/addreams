# Plans Task Board

Last updated: 2026-02-12

## Current Priority

1. Wire and deploy Qwen image APIs (no video, no new infra).

## Jump Links

1. Qwen sprint index: `docs/plans/backend-qwen-integration/README.md`
2. Qwen roadmap: `docs/plans/backend-qwen-integration/01-qwen-backend-roadmap.md`
3. Qwen sprint decisions: `docs/plans/backend-qwen-integration/02-qwen-wiring-decisions.md`
4. Qwen deploy runbook: `docs/plans/backend-qwen-integration/03-deploy-runbook.md`
5. Deferred infra index: `docs/plans/cloudflare-infra/README.md`
6. Deferred infra sprint: `docs/plans/cloudflare-infra/01-post-qwen-infra-sprint.md`

## Next Tasks (Execution Order)

1. Implement backend upstream client for `qwen-image-max` in `POST /api/workflows/image-from-text`.
2. Implement backend upstream client for `qwen-image-edit-max` in `POST /api/workflows/image-from-reference`.
3. Keep `POST /api/workflows/video-from-reference` explicitly deferred/stub.
4. Add error normalization and provider request ID passthrough in backend responses.
5. Deploy backend and frontend Workers.
6. Run smoke checks in deploy runbook.

## Deferred After Qwen Wiring

1. R2 persistence for generated outputs.
2. D1 metadata/history tracking.
3. Queues for async retries/background processing.
4. Optional service binding hardening for frontend->backend calls.

## Handy Commands

```bash
set -a; source .env.cloudflare.local; set +a
npm run deploy:backend
npm run deploy:frontend
curl -i https://addreams-api.duncanb013.workers.dev/api/health
curl -i https://addreams-web.duncanb013.workers.dev/api/health
```
