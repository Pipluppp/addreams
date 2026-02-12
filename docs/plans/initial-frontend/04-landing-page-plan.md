# 04 - Landing Page Plan (Marketable)

## Objective
Create a marketable landing page that follows `docs/design.md` and funnels users into Product Shoots and Ad Graphics workflows.

## Narrative Structure
1. Hero: editorial frame typography + single pink accent CTA.
2. Workflow split section: two clear paths (`Ad Graphics`, `Product Shoots`).
3. Value section: why Addreams over generic tools.
4. Visual proof section: curated generation examples.
5. Conversion footer CTA.

## Task Checklist
1. Build route: `frontend/src/routes/home.tsx`.
2. Implement hero frame composition primitives.
3. Implement workflow cards linking to studio routes.
4. Build social-proof style section using existing MVP assets from `docs/mvp/`.
5. Add subtle reveal animations (opacity + translateY only).
6. Add responsive nav with explicit CTA to studio.

## Design Constraints
1. Warm cream canvas, black framed typography, sparse pink accents only.
2. No generic SaaS hero blocks or default gradient backgrounds.
3. Limited corner radius (pill accents only).
4. Preserve whitespace rhythm; avoid dense dashboard feel.

## Performance Constraints
1. Lazy-load large image sections.
2. Use modern image formats where possible.
3. Avoid heavy animation libraries for simple transitions.

## Acceptance Criteria
1. Landing page is responsive and visually aligned with design system.
2. Clear conversion path to both core workflows.
3. Lighthouse-style sanity: no obvious heavy JS regressions from hero effects.
