# Frontend Refactor: React Aria + HeroUI v3

## Overview

Migrate the addreams frontend from hand-rolled custom components to **HeroUI v3** (built on **React Aria**), replacing `@squircle-js/react` with native **CSS `corner-shape: squircle`**, while retaining the current visual design language — colors, typography, spacing, and overall aesthetic.

## Goals

1. **Streamlined component layer** — Replace 10 custom atoms and 18 molecules with HeroUI primitives + thin wrappers
2. **Native squircle corners** — Drop `@squircle-js/react` in favor of CSS `corner-shape: squircle` with progressive enhancement
3. **Accessibility by default** — Let React Aria handle ARIA attributes, keyboard navigation, focus management, and form validation instead of hand-rolling them
4. **Retain visual identity** — Same colors, typography, spacing, squircle aesthetic, and brand feel
5. **Incremental migration** — Each phase is independently deployable; no big-bang rewrite

## Plan Documents

| File | Contents |
|------|----------|
| [`01-component-index.md`](./01-component-index.md) | Full inventory of every frontend component, its file path, dependencies, and migration target |
| [`02-design-system-migration.md`](./02-design-system-migration.md) | Mapping current design tokens to HeroUI theming, CSS corner-shape setup, BEM overrides |
| [`03-easy-refactorings.md`](./03-easy-refactorings.md) | Simple 1:1 component swaps that can be done quickly with minimal risk |
| [`04-complex-refactorings.md`](./04-complex-refactorings.md) | Components requiring structural changes, custom compositions, or HeroUI pattern adaptation |
| [`05-phase-1-foundation.md`](./05-phase-1-foundation.md) | Foundation CSS integration: HeroUI styles import, corner-shape setup, semantic token mapping, BEM overrides |
| [`06-phase-2-atoms.md`](./06-phase-2-atoms.md) | Replace each atom component with HeroUI equivalent |
| [`07-phase-3-molecules.md`](./07-phase-3-molecules.md) | Update molecules to compose HeroUI primitives |
| [`08-phase-4-organisms.md`](./08-phase-4-organisms.md) | Adopt HeroUI patterns in organisms and layouts |
| [`09-phase-5-cleanup.md`](./09-phase-5-cleanup.md) | Remove dead code, old dependencies, verify final state |

## Current Stack

- **React 19** + TypeScript
- **Tailwind CSS v4** (`@theme` directive, `@layer` CSS)
- **Jotai** + **Bunshi** + **TanStack Query** (state management — untouched by this refactor)
- **Hono** backend on Cloudflare Workers (untouched)
- **`@squircle-js/react`** for smooth corners (to be removed)
- **`@radix-ui/react-slot`** for `asChild` composition in PillButton (to be removed)

## Target Stack

- Same React 19 + TypeScript + Tailwind v4
- **`@heroui/react` + `@heroui/styles`** component + style layers
- **CSS `corner-shape: squircle`** with `@supports` fallback
- Same Jotai / Bunshi / TanStack Query / Hono — no changes

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Squircle approach | CSS `corner-shape: squircle` with `@supports` progressive enhancement | ~69% coverage (Chromium). Firefox/Safari fall back to standard `border-radius`. Removes entire JS dependency. |
| Migration strategy | Incremental, atom-first | Barrel exports in `components/ui/` let us swap internals without breaking consumers |
| Event naming | Prefer React Aria/HeroUI conventions | Use `onPress` for pressable components; Select uses `onChange` with `value` in HeroUI v3 docs |
| Form validation | Adopt HeroUI's `isInvalid` + `FieldError` | Replaces manual `aria-invalid`, `aria-describedby`, `aria-live` wiring |
| Component structure | Adopt compound component pattern | `<TextField><Label /><Input /><Description /><FieldError /></TextField>` instead of flat props |

## Out of Scope

- Backend changes (Hono, Workers, D1, R2, queues)
- State management refactoring (Jotai atoms, TanStack Query mutations)
- Feature logic (validation schemas, form state, API calls)
- Route structure changes
