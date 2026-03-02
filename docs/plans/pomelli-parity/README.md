# Pomelli Parity Plan Pack (Addreams)

Last updated: 2026-03-02
Status: Planning baseline (ready for implementation kickoff)

## Objective
Ship a Pomelli-inspired Addreams experience that preserves:
1. Simplicity and clarity in the UI.
2. Smooth guided workflows (`Product Shoots`, `Ad Graphics`).
3. Polished template, guidance, and iteration loops.

This plan pack intentionally translates Pomelli patterns into Addreams conventions and stack constraints. It is not a 1:1 clone mandate.

## Source of Truth
1. Product behavior/design digest: `pomelli/POMELLI_SPEC.md`.
2. Existing frontend baseline:
   - `frontend/src/routes/studio/product-shoots.tsx`
   - `frontend/src/routes/studio/ad-graphics.tsx`
3. Existing backend workflow contracts:
   - `backend/src/index.ts`
4. Design baseline:
   - `docs/design.md`

## Plan Files
1. `00-goals-and-constraints.md`
2. `01-reference-catalog-and-doc-rules.md`
3. `02-product-shoots-workflow-plan.md`
4. `03-ad-graphics-workflow-plan.md`
5. `04-shared-design-system-and-guidance.md`
6. `05-data-api-and-job-lifecycle.md`
7. `06-implementation-roadmap-and-qa.md`
8. `07-phase1-2-product-shoots-implementation-notes.md`

## Execution Order
1. Finalize goals, constraints, and parity boundaries.
2. Lock screenshot catalog and documentation conventions.
3. Build shared UI system + workflow shell primitives.
4. Implement Product Shoots parity flow.
5. Implement Ad Graphics parity flow.
6. Implement backend/data contracts for campaign and template behavior.
7. Run QA, telemetry checks, and rollout gates.
