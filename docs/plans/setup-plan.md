# Cloudflare Workers + Hono + React/Vite Setup Decision Plan

Last updated: 2026-02-12

## Objective

Define the smoothest setup for local development and deployment using Cloudflare Workers, Hono, and React/Vite for this repo.

## What the official docs confirm

1. Cloudflare recommends using the Vite plugin for frontend-centric frameworks like React, and Wrangler for backend/Worker-focused projects.
2. The React and Hono framework guides both provide first-party Workers templates via `create-cloudflare` (C3), including Vite + Worker API.
3. Vite plugin workflow is `npm run dev` for local dev, then `npm run build` and `npm run deploy` (or `wrangler deploy`).
4. With Vite plugin, your `wrangler.jsonc` is an input config. Build generates an output `wrangler.json` used by preview/deploy.
5. With Vite plugin, `assets.directory` is not set manually in the input config; it is auto-derived from build output.
6. SPA fallback should use `assets.not_found_handling = "single-page-application"`.
7. API routing can use `assets.run_worker_first` (for example `["/api/*"]`) when you want explicit Worker-first routing.
8. Cloudflare Workers Builds supports connecting GitHub/GitLab repos and auto-deploying on push.
9. You can connect either a new Worker or an existing Worker to Git.
10. For connected builds, Worker name in dashboard must match `name` in `wrangler` config (in configured root directory), or builds fail.
11. For monorepos, per-Worker root directories are supported and recommended.
12. Cloudflare still documents both Pages and Workers; Workers are the strategic unified path, but “Pages is fully gone” is not stated in official docs.

## Reddit discussion evaluation

1. "Use Workers template, then move your stuff over" is solid advice and aligns with official docs.
2. "Pages is legacy and you should not use it" is opinionated/overstated; official docs still support Pages, but Workers is the better default for new full-stack builds.
3. "Create Worker -> connect repo -> deploy with wrangler" is valid and still supported.
4. Suggested file structure (config in root + separate worker/frontend folders) is valid if config paths are correct.
5. `dev:wrangler` as a primary frontend+backend workflow is not ideal for Vite-plugin full-stack apps; prefer `npm run dev`.
6. Setting `assets.directory = "./dist"` in the input `wrangler` config is outdated for Vite plugin mode.

## Decision for Addreams

1. Use Workers-first architecture.
2. Use C3 template baseline for correctness, then port existing code/content.
3. Prefer one full-stack Worker for MVP velocity.
4. Keep monorepo split (`frontend/` + `backend/`) as a phase-2 option if independent deployment boundaries become necessary.
5. Default deployment mode: manual deploy via Wrangler (no Git-connected auto deploy).

## Recommended architecture now (smoothest path)

1. Start from the Hono full-stack template:
   `npm create cloudflare@latest -- --template=cloudflare/templates/vite-react-template`
2. Keep a single Worker entry (`src/worker/index.ts`) for Hono API.
3. Keep SPA client in `src/react-app` (or template default path).
4. Use Vite plugin in `vite.config.ts`.
5. Keep `wrangler.jsonc` minimal:
   - `name`
   - `compatibility_date`
   - `main` (Worker entry)
   - `assets.not_found_handling = "single-page-application"`
   - optionally `assets.run_worker_first = ["/api/*"]`

## Development workflow

1. `npm install`
2. `npm run dev`
3. Develop frontend and Hono API together with HMR in Workers runtime.
4. `npm run build`
5. `npm run preview`
6. `npm run deploy`

## Deployment workflow (manual-only default)

1. Keep GitHub for source control only.
2. Do not connect the Worker to Workers Builds.
3. Deploy from local machine only:
   - `npm run deploy` (typically wraps `wrangler deploy`).
4. If CI/CD is needed later, add it explicitly (GitHub Actions or Workers Builds), but keep it opt-in.

## Optional Git-driven deployment (not default)

1. Cloudflare Workers Builds can still be enabled later if needed.
2. If enabled, pushes to configured branches trigger builds/deploys.
3. For monorepos, set each Worker root directory to its own project folder.

## If you keep separate `frontend/` and `backend/` Workers

1. Create two Worker projects in Cloudflare dashboard.
2. Optionally connect the same Git repo to both Workers (only if you later want Git-driven builds).
3. Set root directory per Worker (`/frontend`, `/backend`).
4. Configure each Worker’s build/deploy command separately.
5. Optionally set build watch paths to avoid unnecessary builds.
6. If you do not want auto deploy, skip Git connection and run `wrangler deploy` from each folder manually.

## Wrangler's role in this setup

1. Source of truth for Worker config (`wrangler.jsonc`): name, entrypoint, compatibility date, assets routing, bindings.
2. Local Cloudflare runtime/dev orchestration (directly or through Vite plugin workflow).
3. Deployment CLI (`wrangler deploy`) for manual, controlled releases.
4. Environment and secret management (`wrangler secret`, resource/binding commands).
5. Validation and typing (`wrangler check`, `wrangler types`) before deploy.

## "Hello World keeps showing" checklist

1. Confirm Worker dashboard project is connected to the correct repo.
2. Confirm Worker name in dashboard matches `wrangler` `name`.
3. Confirm root directory points to folder with the intended `wrangler.jsonc`.
4. Confirm `main` points to real Worker entry file.
5. Confirm you are using the correct deploy command for that project.
6. For SPA + API, confirm `not_found_handling` is set correctly and optionally add `run_worker_first` for `/api/*`.
7. If using Vite plugin, do not rely on manual `assets.directory` in input config.

## Decision summary

1. Your workflow is still fully supported as of 2026-02-12.
2. The smoothest path is: C3 Hono/Vite template baseline, then migrate your existing code into it.
3. Keep deploys manual with Wrangler unless you explicitly choose CI/CD later.
4. Treat Reddit snippets as directional, but follow current Vite-plugin docs for final config behavior.

## Source links

1. https://developers.cloudflare.com/workers/vite-plugin/
2. https://developers.cloudflare.com/workers/vite-plugin/get-started/
3. https://developers.cloudflare.com/workers/vite-plugin/tutorial/
4. https://developers.cloudflare.com/workers/vite-plugin/reference/migrating-from-wrangler-dev/
5. https://developers.cloudflare.com/workers/get-started/guide/
6. https://developers.cloudflare.com/workers/wrangler/
7. https://developers.cloudflare.com/workers/development-testing/wrangler-vs-vite/
8. https://developers.cloudflare.com/workers/framework-guides/web-apps/react/
9. https://developers.cloudflare.com/workers/framework-guides/web-apps/more-web-frameworks/hono/
10. https://developers.cloudflare.com/workers/ci-cd/builds/
11. https://developers.cloudflare.com/workers/ci-cd/builds/configuration/
12. https://developers.cloudflare.com/workers/ci-cd/builds/git-integration/
13. https://developers.cloudflare.com/workers/ci-cd/builds/advanced-setups/
14. https://developers.cloudflare.com/workers/static-assets/migration-guides/migrate-from-pages/
15. https://www.reddit.com/r/CloudFlare/comments/1m4prmt/new_to_cloudflare_workers_pages/
