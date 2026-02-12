# 00 - Goals and Constraints

Last updated: 2026-02-12
Status: Finalized (aligned to docs/design.md)

## Objective
Define the redesign intent and non-negotiable constraints before visual and UX execution.

## Design Linkage
1. Aligns with `docs/design.md` sections 1, 2, 10, 11, and 12.
2. Any constraints conflict is resolved in favor of `docs/design.md`.

## Primary Goals
1. Redesign Addreams frontend to feel modern, cohesive, and premium.
2. Replace current workflow pages with guided step-based flows.
3. Build a marketable landing page with stronger conversion intent.
4. Preserve frontend-backend contract compatibility during stub phase.

## Product Surfaces In Scope
1. Landing page (`/`).
2. Studio shell (`/studio/*`).
3. Product Shoots workflow (`/studio/product-shoots`).
4. Ad Graphics workflow (`/studio/ad-graphics`).

## Hard Constraints
1. Tech stack remains React 19 + TypeScript + Tailwind v4 + Jotai + Bunshi + TanStack Query.
2. Tailwind v4 CSS-first setup (`@import "tailwindcss"` + `@theme`).
3. Qwen-ready payload contract preserved for workflow submissions.
4. No direct browser-to-official-Qwen integration in this phase.
5. Mobile-first responsiveness is required from the first implementation pass.
6. Any rounded visual component must use `squircle-js` rather than standard CSS border radius alone.
7. Accent palette is fixed to `#0064FF`, `#EC520B`, and `#FFCB00` with role-based usage.

## UX Constraints
1. Workflows must be step-based and progress-driven.
2. Users should never lose entered data when moving between steps.
3. Validation should be immediate and scoped to current step requirements.
4. Final submit remains blocked until required steps are valid.

## Quality Constraints
1. Maintain accessibility baseline for labels, keyboard navigation, and focus visibility.
2. Avoid unnecessary re-renders and request waterfalls.
3. Route-level code splitting for major pages.
4. Final implementation must pass project quality gates.
5. Visual hierarchy must remain clear in grayscale (color cannot be the only grouping signal).
