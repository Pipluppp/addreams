# Initial Goal Baseline

## Primary Goal

Migrate UI from custom atoms/molecules to HeroUI v3 (React Aria-based) while preserving existing visual design, spacing, typography, and UX behavior.

## Non-Negotiable Constraints

1. Preserve visual language (colors, spacing, typography, component shape language).
2. Use HeroUI v3 canonical APIs.
3. Keep route semantics for navigation links.
4. Keep `focus-first-error` until route-level validation architecture is changed.
5. Remove `@squircle-js/react` only after all usages are migrated.

## Expected End State

- Custom wrapper-heavy atoms are replaced or minimized.
- Molecules/organisms/routes use direct HeroUI composition where practical.
- Legacy squircle wrappers and shim exports are removed.
- Build and typecheck remain green.
