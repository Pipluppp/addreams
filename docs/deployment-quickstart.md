# Deployment Quickstart

This is the current deployment runbook for Addreams.

## Current Production Endpoints

- Frontend Worker: `https://addreams-web.duncanb013.workers.dev`
- Backend Worker: `https://addreams-api.duncanb013.workers.dev`

## How Runtime API Routing Works

- Backend API routes are under `/api/*`.
- On `addreams-web.*.workers.dev`, frontend runtime infers API base as:
  - `https://addreams-api.<subdomain>.workers.dev/api`
- In local dev, frontend uses `/api` and Vite/Worker dev proxy behavior.

## Auth/API Base URL Checklist

Set these frontend env vars when you need explicit routing:

- `VITE_AUTH_BASE_URL`
- `VITE_API_BASE_URL`

This checklist is intentionally documentation-only and should not be rendered in user-facing auth UI.

Recommended values by environment:

1. Local Vite + local backend worker
- `VITE_AUTH_BASE_URL=http://127.0.0.1:8787`
- `VITE_API_BASE_URL=http://127.0.0.1:8787/api`

2. workers.dev (`addreams-web.*` + `addreams-api.*`)
- Runtime inference can work.
- Explicit values are still safer:
- `VITE_AUTH_BASE_URL=https://addreams-api.<subdomain>.workers.dev`
- `VITE_API_BASE_URL=https://addreams-api.<subdomain>.workers.dev/api`

3. Custom domain deployments
- Always set explicit values.
- Example:
- `VITE_AUTH_BASE_URL=https://api.your-domain.com`
- `VITE_API_BASE_URL=https://api.your-domain.com/api`

Important:
- Backend root `/` is expected to return `404 {"error":"Not found"}`.
- Health endpoint is `/api/health`, not `/health`.

## Prerequisites

- Node.js 20+
- npm
- Wrangler authenticated via API token in `.env.cloudflare.local`

Load token (without printing secret):

```bash
set -a; source .env.cloudflare.local; set +a
```

## Deploy

Deploy backend first, then frontend:

```bash
npm run deploy:backend
npm run deploy:frontend
```

## Post-Deploy Smoke Tests

```bash
curl -i https://addreams-web.duncanb013.workers.dev/
curl -i https://addreams-api.duncanb013.workers.dev/api/health
curl -i -X OPTIONS 'https://addreams-api.duncanb013.workers.dev/api/workflows/image-from-text' \
  -H 'Origin: https://addreams-web.duncanb013.workers.dev' \
  -H 'Access-Control-Request-Method: POST' \
  -H 'Access-Control-Request-Headers: content-type'
curl -i -X POST 'https://addreams-api.duncanb013.workers.dev/api/workflows/image-from-text' \
  -H 'Origin: https://addreams-web.duncanb013.workers.dev' \
  -H 'Content-Type: application/json' \
  --data '{"prompt":"smoke test"}'
```

Expected:
- Frontend `/` -> `200` HTML
- Backend `/api/health` -> `200` JSON
- Workflow preflight OPTIONS -> `204` with CORS headers
- Workflow POST -> `202` JSON stub

## Common Gotcha

If calls go to `https://addreams-api.../workflows/...` (missing `/api`), browser preflight can fail with CORS errors.  
Correct path is `https://addreams-api.../api/workflows/...`.
