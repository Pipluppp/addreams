# 03 - Studio Stepper Shell

Last updated: 2026-02-12
Status: Finalized (aligned to docs/design.md)

## Objective
Create a shared stepper framework used by both Product Shoots and Ad Graphics workflows.

## Design Linkage
1. Aligns with `docs/design.md` section 7.
2. Stepper interactions and state behaviors must follow `docs/design.md` behavior rules.

## Layout Structure
1. Header area:
   - workflow title
   - progress summary
2. Step navigation:
   - horizontal on desktop
   - stacked or compact rail on mobile
3. Step content panel:
   - current step form/content only
4. Sticky action bar:
   - Back
   - Next / Continue
   - Submit on final step

## Core Stepper Behavior
1. Step state model: `not_started`, `in_progress`, `valid`, `blocked`.
2. Navigation policy:
   - forward allowed only if current step valid
   - backward always allowed
3. Draft persistence:
   - keep entered values while switching steps and routes
4. Error handling:
   - focus first invalid field when user tries to continue
5. Mobile handling:
   - persistent actions visible without excessive scrolling

## Shared Step Definitions (Base)
1. Step 1: Creative Brief.
2. Step 2: Inputs.
3. Step 3: Creative Controls.
4. Step 4: Advanced Controls.
5. Step 5: Review and Generate.
6. Step 6: Result and Iterate.

## Technical Notes
1. Route-level shared state: Jotai.
2. Scoped dependencies and API client injection: Bunshi.
3. Submission and async states: TanStack Query mutations.
