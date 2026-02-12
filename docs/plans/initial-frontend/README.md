# Initial Frontend Plan Pack

Last updated: 2026-02-12
Status: Completed on 2026-02-12.

## Completion Summary
1. Foundation standards were implemented for React 19 + Tailwind v4 tokenized styling.
2. Product Shoots and Ad Graphics studio workflows were delivered against stub backend routes.
3. Landing page implementation was completed and aligned to `docs/design.md`.
4. Qwen parameter component mapping was implemented for the planned MVP field set.
5. Required quality gates were executed and passed (`lint`, `format:check`, `typecheck`, `build`, `cf:check`).

## Goal
Ship a production-shaped frontend for Addreams with these capabilities:
1. `Product Shoots` workflow (text prompt + parameters).
2. `Ad Graphics` workflow (image editing: input image + text prompt + parameters).
3. A marketable landing page aligned with `docs/design.md`.

The backend remains stubbed for this phase. Frontend is Qwen-ready but does not call official Qwen APIs directly yet.

## Backend Context (Hono)
1. Backend runtime/framework for this phase is Cloudflare Worker + Hono (`backend/src/index.ts`).
2. Frontend must treat Hono route contracts as source of truth during stub phase.
3. If backend DTO/response shapes change in Hono handlers, frontend API types must be updated in the same task.

## Out of Scope (This Phase)
1. Direct browser-to-Qwen calls.
2. Auth/profile/billing.
3. Full persisted generation history across sessions.
4. Video generation UI (later phase).

## Plan Files
1. `00-engineering-guardrails.md`
2. `01-foundation-and-standards.md`
3. `02-product-shoots-plan.md`
4. `03-ad-graphics-plan.md`
5. `04-landing-page-plan.md`
6. `05-qwen-parameter-component-matrix.md`
7. `06-testing-and-release-plan.md`
8. `07-hono-api-contract.md`

## Delivery Sequence
1. Engineering guardrails sign-off.
2. Foundation and design system setup.
3. Product Shoots UI (text-to-image).
4. Ad Graphics UI (image-edit flow).
5. Landing page polish and conversion sections.
6. Qwen parameter parity pass.
7. Local QA, staging deploy, production deploy (manual Wrangler deploy).
