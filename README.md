# Addreams

Workers-first monorepo for Addreams MVP.

- `frontend/`: React 19 + Vite + Tailwind v4 SPA, deployed as a Worker with static assets.
- `backend/`: Hono API Worker with MVP workflow stubs.
- Deployment mode: manual via Wrangler (no auto-deploy by default).

## Prerequisites

- Node.js 20+
- npm 10+
- Cloudflare account and `wrangler login`

## Install

```bash
npm install
```

## Local Development

```bash
npm run dev
```

This starts:

- Frontend Vite dev server: `http://127.0.0.1:5173`
- Backend Worker dev server: `http://127.0.0.1:8787`

Frontend `/api/*` requests are proxied to backend in local dev.

## Manual Deploy (No Auto Deploy)

Deploy backend first:

```bash
npm run deploy:backend
```

Then deploy frontend:

```bash
npm run deploy:frontend
```

For frontend Worker-level `/api/*` proxying in production, set `API_BASE_URL` on `addreams-web` to your deployed backend URL:

```bash
cd frontend
npx wrangler deploy --var API_BASE_URL=https://addreams-api.<your-workers-subdomain>.workers.dev
```

## GitHub Integration (Optional)

GitHub is source control by default only. Pushing commits does not deploy unless you later enable Workers Builds in Cloudflare dashboard.

## Useful Commands

```bash
npm run typecheck
npm run build
npm run check
npm run dev:frontend
npm run dev:backend
```
