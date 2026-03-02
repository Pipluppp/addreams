# 07 - Phase 1 + 2 Product Shoots Implementation Notes

Last updated: 2026-03-03
Status: Implemented in frontend route refactor (with sequential UX refinement)

## Scope covered
1. Shared studio route tokens are now scoped to Product Shoots route surfaces via `.studio-route` token overrides.
2. Shared studio primitives were added for entry cards, template tiles/counters, ratio chips, output gallery/actions, context panel, action bar, guidance strip, and single-image editor layout.
3. Product Shoots route was refactored into explicit state machine-style states:
   - `PS-ENTRY` (PM-01, PM-13)
   - `PS-GUIDED-COMPOSE` (PM-02, PM-03, PM-06)
   - `PS-TEMPLATE-PICKER` (PM-04, PM-05)
   - `PS-GUIDED-RESULTS` (PM-07, PM-08)
   - `PS-EDIT-SINGLE` (PM-09, PM-10, PM-11, PM-16)

## Implementation notes
1. Existing backend workflow endpoints were preserved; Product Shoots still calls the existing text generation endpoint and existing credit sync path.
2. Template selection uses a hard cap of 4 with disabled unselected tiles at cap and a persistent counter chip.
3. Guided results include a context panel, gallery selection, per-image actions, and a bottom action bar.
4. Single-image editor includes loading overlay, disabled conflicting controls, thumbnail strip navigation, and iterative regenerate append behavior.
5. Guided compose UX was refined to sequential substeps so users complete one decision at a time instead of seeing all controls on one screen.
6. Route-level studio tokens now align with Addreams palette direction while preserving scoped studio styling.
7. Template/entry/results views now use placeholder visual tiles to keep image-first layout parity while API template assets are not yet wired.
8. Guided compose was reshaped to upload-only product input (URL removed), template selection, and ratio setup before entering the generation workspace.
9. Generation loop now happens inside `PS-EDIT-SINGLE`; back from editor lands on recap gallery (`PS-GUIDED-RESULTS`).
10. Core app pages keep the persistent top bar but suppress the landing footer to improve immersion.
11. Sidebar app-shell navigation was removed; studio flows stay in the top-bar shell.
12. Template picker is now a large rectangular modal overlay with stronger backdrop blur/transparency and focus-first interaction.
13. Back/close/edit interactions were simplified toward icon-first controls.
14. Aspect-ratio controls use HeroUI Select patterns with visual shape indicators in trigger + menu.
15. Single-image editor was flattened and iteration thumbnails moved below the main workspace for direct selection.

## Tests added
1. Template cap logic (`toggleTemplateSelection`).
2. State transition behavior (`transitionProductShootsState`).
3. Generate/edit guard behavior (`canGenerateGuidedShoots`, `canRegenerateSingleImage`).

## Known divergence from full roadmap
1. `PS-FREEFORM-COMPOSE` and `PS-FREEFORM-RESULTS` are not included in this implementation pass.
2. "Add to Business DNA" actions are currently UI placeholders pending backend/data phase wiring.
