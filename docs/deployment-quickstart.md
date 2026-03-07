# Deployment Quickstart

This is the current deployment runbook for Addreams.

## Current Production Endpoints

- Frontend Worker: `https://addreams-web.duncanb013.workers.dev`
- Backend Worker: `https://addreams-api.duncanb013.workers.dev`

## How Runtime API Routing Works

- Backend API routes are under `/api/*`.
- Frontend browser requests must always use same-origin `/api/*`.
- `addreams-web` Worker proxies `/api/*` to the backend Worker via `API_BASE_URL`.
- Do not point browser code directly at backend origins for auth/api/image asset requests.

## Auth/API Base URL Checklist

Set these frontend env vars only when you intentionally need explicit routing:

- `VITE_AUTH_BASE_URL`
- `VITE_API_BASE_URL`

This checklist is intentionally documentation-only and should not be rendered in user-facing auth UI.

Recommended values by environment:

1. Local Vite + local backend worker
- `VITE_AUTH_BASE_URL=http://127.0.0.1:8787`
- `VITE_API_BASE_URL=http://127.0.0.1:8787/api`

2. workers.dev (`addreams-web.*` + `addreams-api.*`)
- Recommended browser config:
- `VITE_AUTH_BASE_URL=` (empty / unset)
- `VITE_API_BASE_URL=/api`
- Set `API_BASE_URL` on the frontend Worker to your backend Worker origin.

3. Custom domain deployments
- Keep browser config same-origin:
- `VITE_AUTH_BASE_URL=` (empty / unset)
- `VITE_API_BASE_URL=/api`
- Configure frontend Worker `API_BASE_URL=https://api.your-domain.com`.

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

PowerShell (Windows):

```powershell
Get-Content .env.cloudflare.local | ForEach-Object {
  if ($_ -match '^\s*(#|$)') { return }
  $name, $value = $_ -split '=', 2
  if (-not $name -or -not $value) { return }
  [System.Environment]::SetEnvironmentVariable($name.Trim(), $value.Trim(), 'Process')
}
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
curl -i -X OPTIONS 'https://addreams-web.duncanb013.workers.dev/api/workflows/image-from-reference' \
  -H 'Origin: https://addreams-web.duncanb013.workers.dev' \
  -H 'Access-Control-Request-Method: POST' \
  -H 'Access-Control-Request-Headers: content-type'
curl -i -X POST 'https://addreams-web.duncanb013.workers.dev/api/workflows/image-from-reference' \
  -H 'Origin: https://addreams-web.duncanb013.workers.dev' \
  -H 'Content-Type: application/json' \
  --data '{"prompt":"smoke test","referenceImageUrl":"https://example.com/image.jpg"}'
```

Expected:
- Frontend `/` -> `200` HTML
- Backend `/api/health` -> `200` JSON
- Frontend proxied workflow OPTIONS -> `204` with CORS headers
- Frontend proxied workflow POST -> workflow response JSON

## Common Gotcha

If calls go to `https://addreams-api.../workflows/...` (missing `/api`), browser preflight can fail with CORS errors.  
Correct path is `https://addreams-api.../api/workflows/...`.
