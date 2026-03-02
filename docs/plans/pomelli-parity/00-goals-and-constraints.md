# 00 - Goals and Constraints

Last updated: 2026-03-02
Status: Draft for engineering sign-off

## Objective
Define what "Pomelli-inspired Addreams" means in deliverable engineering terms.

## Product Goals
1. Addreams workflows should feel simpler to start and easier to complete than the current baseline.
2. `Product Shoots` must support both:
   - guided template flow
   - flexible prompt/reference flow
3. `Ad Graphics` must provide campaign-first generation with reusable assets and guided suggestions.
4. Result experiences must be iterative by default:
   - select
   - edit
   - regenerate
   - export/reuse
5. Every major state must be explicit and user-legible:
   - empty
   - composing
   - validating
   - generating
   - completed
   - recoverable error

## UX Goals
1. Minimize cognitive load per screen by showing only context-relevant controls.
2. Keep source context visible during generation/results (input recap panels).
3. Reduce dead ends with direct next actions (`Edit`, `Create Campaign`, `Download`, `Save`).
4. Favor progressive disclosure over long single-screen forms.
5. Core app routes (`/product-shoots`, `/ad-graphics`) should feel like dedicated app surfaces, not embedded marketing pages.

## Design Goals
1. Move studio surfaces to dark, focused, low-noise composition.
2. Preserve Addreams identity while borrowing Pomelli interaction patterns.
3. Standardize a compact component vocabulary for cards, chips, tiles, action bars, and side tools.

## Non-Goals (Phase 1)
1. Full Business DNA parity.
2. Exact visual cloning of Pomelli typography/colors.
3. Adding video generation parity.
4. Rebuilding all landing pages before studio parity is complete.

## Existing Baseline Gaps (Current Code)
1. Studio routes are still mostly form-centric with a minimal 2-step `compose/result` shell.
2. No guided template picker flow with multi-select caps.
3. No dedicated single-image editing workspace with thumbnail strip + tools pane.
4. No explicit campaign idea stage in `Ad Graphics`.
5. Limited output action model (missing robust per-image contextual controls).

## Technical Constraints
1. Frontend stack remains:
   - React 19
   - TypeScript
   - Tailwind v4
   - HeroUI v3
   - Jotai + Bunshi
   - TanStack Query
2. Backend stack remains:
   - Hono on Cloudflare Workers
   - D1 + R2
   - better-auth
3. Preserve existing workflow endpoints unless an extension is required:
   - `POST /api/workflows/image-from-text`
   - `POST /api/workflows/image-from-reference`
4. Credits enforcement remains mandatory per workflow.

## UX Quality Bars (Definition of Done)
1. First successful generation in either workflow should be achievable without reading external docs.
2. Users can visually understand where they are in the workflow at all times.
3. Users can perform at least one edit iteration without losing prior context.
4. Each primary state has deterministic behavior for loading/error/retry.
5. New screens maintain keyboard accessibility and focus integrity.

## Success Metrics
1. Task completion:
   - prompt-to-first-output completion rate improves vs current baseline.
2. Iteration health:
   - share of sessions with at least one `Edit` or `Regenerate` action increases.
3. UX friction:
   - reduction in invalid submit attempts and back-and-forth step churn.
4. Reliability:
   - failed generation recoverability (retry success) is measurable.
