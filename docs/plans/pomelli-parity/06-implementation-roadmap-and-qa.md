# 06 - Implementation Roadmap and QA Plan

Last updated: 2026-03-03
Status: Planned

## Objective
Deliver Pomelli-inspired workflow parity in controlled phases with clear acceptance gates.

## Phase 1 - Parity Foundations
1. Finalize state maps and interaction contracts from `pomelli/POMELLI_SPEC.md`.
2. Implement screenshot-ID tracing process from `01-reference-catalog-and-doc-rules.md`.
3. Build shared studio primitives and dark studio token layer.

Exit criteria:
1. Shared components render in Storybook/dev route playground.
2. Keyboard + focus behavior validated on primitives.

## Phase 2 - Product Shoots Parity
1. Implement entry split (`guided` vs `freeform`).
2. Implement template picker with categories, cap, and selection counter.
3. Implement guided + freeform result galleries with context panel.
4. Implement single-image editor with loading and iterative regeneration.
5. Refine guided compose into a focused setup page (product + templates + ratio) before entering the iterative editor workspace.
6. Keep Addreams visual identity while matching Pomelli state cadence and image-first composition.
7. Make Product Shoots and Ad Graphics run in immersive app-shell pages without landing top-bar/footer chrome.

Exit criteria:
1. All Product Shoots states in plan file 02 are covered.
2. At least one happy-path E2E test per mode passes.

## Phase 3 - Ad Graphics Campaign Flow
1. Implement campaign prompt composer + suggestion flow.
2. Implement campaign idea selection into creative generation.
3. Add recent campaigns and reusable campaign cards.
4. Reuse shared editor/result patterns for consistency.

Exit criteria:
1. Campaign prompt -> idea -> output loop works end-to-end.
2. Results can be edited and exported without state loss.

## Phase 4 - Backend/Data Extensions
1. Add template API + persistence.
2. Add campaign suggest/list/detail APIs.
3. Add lineage metadata for edit chains.
4. Validate credit semantics and failure refunds under new flows.

Exit criteria:
1. Frontend no longer depends on hardcoded template/suggestion data.
2. API contracts are documented and type-safe in frontend clients.

## Phase 5 - QA, Telemetry, and Rollout
1. QA pass across states and transitions (including edge/error states).
2. Add interaction analytics for:
   - mode selection
   - template selection
   - edit/regenerate usage
3. Staged rollout with feature flags if needed.

Exit criteria:
1. No blocking regressions in existing generation/history/profile flows.
2. Core funnel metrics are captured and dashboarded.

## Test Plan

### Unit tests
1. Template selection cap logic.
2. State machine transition guards.
3. Payload composer logic for guided/freeform/campaign flows.

### Integration tests
1. Workflow form validation and first-invalid focus behavior.
2. Mutation success/failure with credit updates.
3. Editor loop update semantics (selected output + regen results).

### E2E scenarios
1. Product Shoots guided happy path.
2. Product Shoots freeform happy path.
3. Ad Graphics campaign suggestion to generation path.
4. Out-of-credits behavior on both workflows.
5. API failure recovery and retry behavior.

## Risks and Mitigations
1. Risk: Overfitting to screenshots, missing intent.
   - Mitigation: Keep descriptor-first specs and explicit divergence notes.
2. Risk: Scope creep with Business DNA parity.
   - Mitigation: enforce phase boundary (out-of-scope for phase 1).
3. Risk: UX inconsistency across routes.
   - Mitigation: shared primitives before route-specific implementation.
4. Risk: API contract drift between frontend/backend.
   - Mitigation: typed client updates in same PR as backend changes.

## Release Gate Checklist
1. `npm run lint`
2. `npm run format:check`
3. `npm run typecheck`
4. `npm run build`
5. Workflow smoke checks:
   - Product Shoots guided + freeform
   - Ad Graphics campaign path
   - history item integrity
