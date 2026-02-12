# 01 - Foundation and Standards

Status: Completed on 2026-02-12.

## Objective
Build a stable frontend foundation using React 19 + Tailwind v4 tokens + reusable components, while following the aesthetic system in `docs/design.md`.

## Dependency
1. Must comply with `docs/plans/initial-frontend/00-engineering-guardrails.md` before implementation starts.

## Required Standards
1. Use Tailwind v4 CSS-first tokens (`@theme`) in `frontend/src/index.css`.
2. Avoid generic UI defaults; enforce design tokens and frame motif.
3. Follow performance constraints:
   - no barrel import chains in hot paths
   - code split large sections/routes
   - memoize expensive derived data only when proven hot
4. Keep interaction logic in event handlers, not effects, unless side effects require it.

## Task Checklist
1. Establish token architecture.
   - Define semantic tokens in `frontend/src/index.css` mapped to values in `docs/design.md`.
   - Include color, spacing rhythm, border, and motion tokens.
2. Install and wire typography.
   - Choose one display font and one body font from `docs/design.md`.
   - Apply display font only to key editorial headings.
3. Create core UI primitives in `frontend/src/components/ui/`.
   - `Frame`
   - `PillButton`
   - `TextField`
   - `TextareaField`
   - `SelectField`
   - `ToggleField`
   - `SectionShell`
   - `WorkflowTabs`
4. Create app shell + route structure in `frontend/src/`.
   - routes: `/`, `/studio/product-shoots`, `/studio/ad-graphics`
   - include shared nav/footer and responsive behavior
5. Add frontend API client scaffold in `frontend/src/lib/api.ts`.
   - typed request/response DTOs
   - centralized fetch + error normalization
6. Add local state boundaries.
   - Jotai atoms for shared route-level client state
   - Bunshi for feature-level dependency composition where cross-feature injection is needed
   - TanStack Query mutations for submit actions and async server state

## Acceptance Criteria
1. No hardcoded colors outside token definitions.
2. Shared primitives used by all studio forms.
3. Route-level code splitting enabled for studio pages.
4. `npm run typecheck -w frontend` and `npm run build -w frontend` pass.
