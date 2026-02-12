# 00 - Frontend Engineering Guardrails

Last updated: 2026-02-12

## Objective
Define non-negotiable frontend implementation standards so the initial Addreams frontend stays clean, scalable, accessible, and fast.

## Architecture and Component Strategy (Atomic)
1. Use an atomic hierarchy in `frontend/src/components/`:
   - `atoms/`: small primitives (`Button`, `Input`, `Label`, `IconButton`)
   - `molecules/`: composed controls (`PromptField`, `SizeSelector`, `ImageInput`)
   - `organisms/`: feature sections (`ProductShootsForm`, `AdGraphicsPanel`)
   - `layouts/`: page scaffolds (`StudioLayout`, `LandingSection`)
2. Do not skip levels by placing complex feature logic directly inside pages.
3. Keep page routes thin: composition + data wiring only.

## CSS and Tailwind v4 Rules
1. Use Tailwind v4 CSS-first configuration only:
   - `@import "tailwindcss"`
   - `@theme` tokens in CSS
2. Define semantic tokens once; consume everywhere.
   - No repeated hardcoded hex values in components.
   - No ad hoc spacing/color values when token exists.
3. Prefer utility classes + component variants over custom one-off CSS blocks.
4. Use `@utility` only for true repeated patterns.
5. No `transition: all`; list transition properties explicitly.

## Styling Simplicity Rules
1. Prefer a small, reusable variant API over many bespoke component props.
2. Minimize class string sprawl by extracting stable variants.
3. Avoid visual effects unless tied to design intent in `docs/design.md`.
4. Keep rounded corners limited to explicit accent elements (pill pattern).

## State Management Decision Matrix
1. Local-only transient state (single component): `useState`.
2. Shared client state across sibling components or a route: `Jotai` atoms.
3. Cross-feature dependency composition / scoped service injection: `Bunshi`.
4. Async server state, mutations, retries, cache invalidation: `TanStack Query`.
5. Do not use global atoms for short-lived local input state that can stay local.

## React Performance Guardrails
1. Avoid request waterfalls; parallelize independent calls.
2. Split routes and heavy sections with lazy loading.
3. Avoid barrel imports in hot paths.
4. Use memoization only for measured expensive work.
5. Keep render functions pure; move interaction side effects to event handlers.

## Accessibility and UX Baseline
1. Every form field needs label and explicit validation messaging.
2. Icon-only buttons require `aria-label`.
3. Use semantic HTML before ARIA fallback.
4. Ensure visible `:focus-visible` states.
5. Respect `prefers-reduced-motion`.
6. Ensure keyboard navigation for all interactive controls.

## Complexity Budget
1. Prefer straightforward composition over abstraction-heavy patterns.
2. Default guideline:
   - atoms <= 120 LOC
   - molecules <= 200 LOC
   - organisms <= 300 LOC
3. Extract helper modules when a component becomes multi-concern.
4. If a component needs comments to explain basic flow, split it.

## Required Pre-Merge Checks
1. `npm run lint`
2. `npm run format:check`
3. `npm run typecheck`
4. `npm run build`
5. `npm run cf:check -w frontend`
6. UI checklist pass against latest Web Interface Guidelines rules (source: `vercel-labs/web-interface-guidelines`).

## Web Interface Guidelines Review Runbook
1. Pull latest rules from:
   - `https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md`
2. Review all touched UI files against that rule set.
3. Log findings in terse `file:line` format and resolve before merge.
