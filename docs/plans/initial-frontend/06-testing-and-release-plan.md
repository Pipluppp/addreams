# 06 - Testing and Release Plan (Stub Backend)

Status: Completed on 2026-02-12.

## Objective
Ship initial frontend publicly with reliable local and deployed behavior while backend remains stubbed.

## Local Test Checklist
1. Start local services:
   - `npm run dev -w backend`
   - `npm run dev -w frontend`
2. Verify Product Shoots submit path reaches `/api/workflows/image-from-text`.
3. Verify Ad Graphics submit path reaches `/api/workflows/image-from-reference`.
4. Verify form validation blocks bad payloads.
5. Verify landing links route correctly into both studio pages.

## Quality Gates
1. `npm run lint`
2. `npm run format:check`
3. `npm run typecheck`
4. `npm run build`
5. `npm run cf:check -w frontend`
6. Guardrails pass against `docs/plans/initial-frontend/00-engineering-guardrails.md`
7. UI checklist pass against latest Web Interface Guidelines ruleset before production deploy
8. Contract verification pass against `docs/plans/initial-frontend/07-hono-api-contract.md`

## Execution Result
1. `npm run lint`: passed.
2. `npm run format:check`: passed.
3. `npm run typecheck`: passed.
4. `npm run build`: passed.
5. `npm run cf:check -w frontend`: passed.

## Deployment Plan (Manual)
1. Deploy backend stub:
   - `npm run deploy:backend`
2. Deploy frontend:
   - `npm run deploy:frontend`
3. Set frontend Worker var for API proxy target:
   - `cd frontend`
   - `npx wrangler deploy --var API_BASE_URL=https://<backend-worker>.workers.dev`

## Post-Deploy Smoke Tests
1. Open landing page and verify visual integrity on desktop/mobile.
2. Run one Product Shoots request and confirm `202` stub response UX.
3. Run one Ad Graphics request and confirm `202` stub response UX.
4. Confirm `/api/health` reachable via frontend path.

## Release Exit Criteria
1. Both core workflows are usable end-to-end against stub backend.
2. Landing page is marketable and visually aligned with `docs/design.md`.
3. Parameter UI covers planned Qwen fields for `Qwen-Image-Max` and `Qwen-Image-Edit-Max`.
4. No auto-deploy dependency; manual deploy runbook confirmed.
