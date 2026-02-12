# Addreams MVP Scaffold Plan (Workers-First Monorepo)

## Summary
Scaffold a clean `npm` workspace monorepo with `frontend/` and `backend/`, optimized for Cloudflare Workers (frontend static assets + backend Hono API), with React 19 + TypeScript + Tailwind v4, and root-level `oxlint`/`oxfmt` quality tooling.

This pass delivers a runnable baseline and workflow API stubs from `docs/mvp.md`, without auth/data infra/deployment execution.

## Locked Decisions
- Monorepo: `npm` workspaces (no Turbo).
- Frontend runtime direction: Cloudflare Vite plugin in `frontend/`.
- Frontend deployment target: Workers Assets (not Pages).
- Backend: separate Hono Worker API.
- Scope: runnable baseline scaffold.
- State/data libs: defer `Jotai`, `Bunshi`, `TanStack Query` for later feature phase.
- API scope now: include workflow stub endpoints, not only health.
- Tests now: none (lint/typecheck/build + manual smoke scenarios only).

## Public APIs / Interfaces / Types
- Backend HTTP API base: `/api`.
- `GET /api/health` response:
  - `{ status: "ok", service: "addreams-api", timestamp: string }`
- `POST /api/workflows/image-from-reference` request:
  - `{ referenceImageUrl: string, prompt: string }`
- `POST /api/workflows/video-from-reference` request:
  - `{ referenceImageUrl: string, prompt: string }`
- `POST /api/workflows/image-from-text` request:
  - `{ prompt: string }`
- All workflow stub responses:
  - `202` with `{ workflow: string, status: "stub", requestId: string, receivedAt: string }`
- Frontend env interface:
  - `VITE_API_BASE_URL` optional; default to relative `/api`.
- Backend env placeholders:
  - `QWEN_API_KEY`, `QWEN_IMAGE_MODEL`, `QWEN_VIDEO_MODEL` reserved but not wired yet.

## Planned Repository Structure
```txt
/
  package.json
  tsconfig.base.json
  .oxlintrc.json
  .oxfmt.json
  .oxlintignore
  .oxfmtignore
  .gitignore
  README.md
  docs/mvp/README.md
  docs/mvp/*.png
  docs/setup-plan.md
  frontend/
    package.json
    index.html
    vite.config.ts
    tsconfig.json
    tsconfig.app.json
    tsconfig.node.json
    wrangler.jsonc
    src/main.tsx
    src/App.tsx
    src/index.css
  backend/
    package.json
    tsconfig.json
    wrangler.jsonc
    .dev.vars.example
    src/index.ts
```

## Implementation Plan
1. Root workspace + tooling
- Create root `package.json` with `workspaces: ["frontend", "backend"]`.
- Add root scripts:
  - `dev`, `dev:frontend`, `dev:backend`
  - `build`, `typecheck`, `lint`, `format`, `format:check`, `check`
- Add root dev dependencies:
  - `oxlint`, `oxfmt`, `typescript`, `concurrently`
- Add `tsconfig.base.json` shared strict TS defaults.
- Add `.oxlintrc.json` initialized from OXC conventions.
- Add `.oxfmt.json` for formatter preferences.
- Add ignore files for `node_modules`, `dist`, `.wrangler`, `.vite`, `coverage`.
- Expand `.gitignore` accordingly.

2. Frontend scaffold (`frontend/`)
- Scaffold Vite React TypeScript app in `frontend/`.
- Add dependencies:
  - `tailwindcss`, `@tailwindcss/vite`, `@cloudflare/vite-plugin`
- Update `vite.config.ts`:
  - Plugins: React, Tailwind v4 Vite plugin, Cloudflare Vite plugin.
  - Dev proxy: `/api` -> `http://127.0.0.1:8787`.
- Configure Tailwind v4 via CSS import in `src/index.css`:
  - `@import "tailwindcss";`
- Build `App.tsx` as MVP-oriented landing shell:
  - Brand hero section.
  - Feature summary.
  - Workflow cards matching `mvp.md`.
  - Buttons/forms that call stub backend routes.
- Add `frontend/wrangler.jsonc` for Workers Assets:
  - `name: "addreams-web"`
  - `compatibility_date: "2026-02-11"`
  - `assets.directory: "./dist"`
  - `assets.not_found_handling: "single-page-application"`

3. Backend scaffold (`backend/`)
- Create Worker package with Hono + TypeScript + Wrangler.
- Add `backend/wrangler.jsonc`:
  - `$schema` to local wrangler schema.
  - `name: "addreams-api"`
  - `main: "src/index.ts"`
  - `compatibility_date: "2026-02-11"`
- Implement `src/index.ts`:
  - Hono app with `/api/health`.
  - Workflow stub routes listed above.
  - JSON `400` on invalid payload shape.
  - Global error handler returning JSON.
- Add `.dev.vars.example` with placeholder Qwen env keys.
- Add backend scripts:
  - `dev` (`wrangler dev --port 8787`)
  - `typecheck`
  - `cf:check` (`wrangler check`)
  - `cf:types` (`wrangler types`)
  - `build` (`wrangler deploy --dry-run`)

4. Monorepo developer experience
- Root `dev` script runs frontend + backend concurrently.
- Root `check` script runs lint + format check + typecheck + build.
- README update:
  - stack summary
  - workspace commands
  - local dev flow
  - non-deployment status note
  - next-step note for Qwen integration and Cloudflare bindings

5. Quality gates
- Lint: `oxlint .`
- Format: `oxfmt --check .`
- Typecheck: workspace TypeScript checks.
- Build:
  - frontend Vite build
  - backend Wrangler dry-run

## Test Cases and Scenarios
- `npm install` completes from root workspaces.
- `npm run dev` starts both servers successfully.
- Opening frontend shows landing/workflow sections without runtime errors.
- Frontend health action returns success from `/api/health`.
- `curl` to each workflow endpoint returns `202` stub JSON payload.
- `npm run lint` passes.
- `npm run format:check` passes.
- `npm run typecheck` passes.
- `npm run build` passes (frontend build + backend dry-run check).

## Assumptions and Defaults
- No auth/profile/better-auth in this phase.
- No D1/R2/Queues/DO bindings in this phase.
- No automated tests in this phase (explicitly deferred).
- No shared `packages/contracts` workspace yet (explicitly deferred).
- Workers Assets target for frontend supersedes earlier Pages default.
- Compatibility dates pinned to `2026-02-11` and should be updated periodically.
