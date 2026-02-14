# Qwen Wiring Deploy Runbook

Last updated: 2026-02-14

## Purpose

Deploy and verify the first production-ready Qwen image wiring on Cloudflare Workers.

Setup prerequisite document:
1. `docs/plans/backend-qwen-integration/00-qwen-account-and-api-key-setup.md`

## Sprint Assumption

This runbook is for a stateless release:
1. No D1
2. No R2
3. No Queues

## Required Config

1. Backend secret:
   - `QWEN_API_KEY`
2. Backend vars (optional but recommended):
   - `QWEN_REGION` (`sg` or `bj`)
   - `QWEN_IMAGE_MODEL` (default `qwen-image-max`)
   - `QWEN_IMAGE_EDIT_MODEL` (default `qwen-image-edit-max`)
   - `QWEN_TIMEOUT_MS` (default `45000`)

## Pre-Deploy Checklist

1. Install deps:
   - `npm install`
2. Confirm Wrangler auth:
   - `npm exec -w backend wrangler whoami`
3. Run repo checks:
   - `npm run check`

## Configure Secrets/Vars

1. Set secret:
```bash
printf '%s' "$QWEN_API_KEY" | npm exec -w backend wrangler secret put QWEN_API_KEY
```
2. Set backend vars during deploy (example):
```bash
npm exec -w backend wrangler deploy \
  --var QWEN_REGION:sg \
  --var QWEN_IMAGE_MODEL:qwen-image-max \
  --var QWEN_IMAGE_EDIT_MODEL:qwen-image-edit-max \
  --var QWEN_TIMEOUT_MS:45000
```

## Deploy

1. Backend:
   - `npm run deploy:backend`
2. Frontend:
   - `npm run deploy:frontend`

## Smoke Tests

1. Backend health:
```bash
curl -i https://addreams-api.duncanb013.workers.dev/api/health
```
2. Frontend root:
```bash
curl -i https://addreams-web.duncanb013.workers.dev/
```
3. Frontend proxied health:
```bash
curl -i https://addreams-web.duncanb013.workers.dev/api/health
```

## Workflow Verification

1. Text-to-image (minimal request form):
```bash
curl -i -X POST https://addreams-api.duncanb013.workers.dev/api/workflows/image-from-text \
  -H 'content-type: application/json' \
  -d '{
    "prompt": "A minimal poster of a sunrise over mountains",
    "size": "1328*1328",
    "promptExtend": true,
    "watermark": false
  }'
```

2. Image-edit (single reference image):
```bash
curl -i -X POST https://addreams-api.duncanb013.workers.dev/api/workflows/image-from-reference \
  -H 'content-type: application/json' \
  -d '{
    "prompt": "Convert this scene into watercolor style",
    "referenceImageUrl": "https://images.pexels.com/photos/414171/pexels-photo-414171.jpeg",
    "size": "1024*1536",
    "promptExtend": true,
    "watermark": false
  }'
```

## Expected Result

1. Both workflow routes return `200` with `status: "completed"` (not `status: "stub"`).
2. Response contains:
   - backend `requestId`
   - provider `requestId`
   - `output.images[]` URL(s)
3. Returned URLs are temporary and expected to expire in about 24 hours.

## Observability During Verification

1. Backend logs:
   - `npm exec -w backend wrangler tail addreams-api`
2. Frontend logs:
   - `npm exec -w frontend wrangler tail addreams-web`

## Rollback Trigger

Rollback if any of the following occur:
1. `/api/workflows/*` returns 5xx for valid inputs.
2. Frontend `/api/*` proxy path starts returning static 404s.
3. Provider failures are returned without backend-safe error wrapping.
