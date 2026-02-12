# Qwen Wiring Deploy Runbook

Last updated: 2026-02-12

## Purpose

Deploy and verify Qwen image API wiring for backend and frontend Workers.

## Sprint Assumption

This runbook intentionally excludes new storage/database resources. D1/R2/Queues are deferred to `docs/plans/cloudflare-infra/`.

## Prerequisites

1. Installed dependencies (`npm install`).
2. Cloudflare auth configured for Wrangler.
3. `.env.cloudflare.local` available locally.

## Pre-Deploy

1. Load local env values:
   - `set -a; source .env.cloudflare.local; set +a`
2. Confirm auth state:
   - `npm exec -w backend wrangler whoami`
3. Run baseline checks:
   - `npm run check`

## Configure Backend Secret

1. Set Qwen API key without printing secret value:
   - `printf '%s' "$QWEN_API_KEY" | npm exec -w backend wrangler secret put QWEN_API_KEY`

## Deploy

1. Deploy backend:
   - `npm run deploy:backend`
2. Deploy frontend:
   - `npm run deploy:frontend`

## Verify Core Routes

1. Backend health:
   - `curl -i https://addreams-api.duncanb013.workers.dev/api/health`
2. Frontend root:
   - `curl -i https://addreams-web.duncanb013.workers.dev/`
3. Frontend proxied health:
   - `curl -i https://addreams-web.duncanb013.workers.dev/api/health`

## Verify Qwen Wiring

1. Text-to-image route returns provider-backed payload (not stub):
```bash
curl -i -X POST https://addreams-api.duncanb013.workers.dev/api/workflows/image-from-text \
  -H 'content-type: application/json' \
  -d '{"prompt":"A minimal poster of a sunrise over mountains"}'
```
2. Image-edit route returns provider-backed payload (not stub):
```bash
curl -i -X POST https://addreams-api.duncanb013.workers.dev/api/workflows/image-from-reference \
  -H 'content-type: application/json' \
  -d '{"prompt":"Convert this scene into watercolor style","referenceImageUrl":"https://images.pexels.com/photos/414171/pexels-photo-414171.jpeg"}'
```

## Logging During Verification

1. Backend logs:
   - `npm exec -w backend wrangler tail addreams-api`
2. Frontend logs:
   - `npm exec -w frontend wrangler tail addreams-web`

## Expected Results

1. No Cloudflare static 404 for frontend `/api/*` routes.
2. Both workflow routes return non-stub responses after wiring.
3. CORS errors are avoided when frontend uses same-origin `/api/*`.

## References

1. https://developers.cloudflare.com/workers/wrangler/commands/
2. https://developers.cloudflare.com/workers/wrangler/commands/#deploy
3. https://developers.cloudflare.com/workers/configuration/secrets/
4. https://developers.cloudflare.com/workers/observability/logs/tail-workers/
