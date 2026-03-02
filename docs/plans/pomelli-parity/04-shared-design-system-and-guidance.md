# 04 - Shared Design System and Guidance Plan

Last updated: 2026-03-03
Status: Planned

## Objective
Create a reusable studio UI system that delivers Pomelli-like simplicity and polish, without copying exact styling.

## Design Direction
1. Preserve Addreams brand colors/tone while adopting Pomelli workflow cadence.
2. Strong hierarchy through spacing, card grouping, and image-first composition.
3. Minimal control exposure by default; progressive disclosure through explicit workflow states.

## Token Plan (Studio Scope)
1. Add studio token namespace in Tailwind/CSS variables:
   - `--studio-bg`
   - `--studio-surface`
   - `--studio-surface-alt`
   - `--studio-border`
   - `--studio-accent`
   - `--studio-text`
   - `--studio-text-muted`
2. Keep current Addreams light-mode system for landing/profile/history routes.
3. Studio route tokens should remain scoped and additive, not force global dark mode.
4. Studio routes should keep the shared top bar but suppress landing footer chrome for immersive app-mode focus.
5. Route-level style scoping:
   - studio routes adopt a stronger light-gradient studio surface using Addreams accents
   - non-studio routes keep existing neutral/light tokens

## Shared Components to Build
1. `StudioEntrySplitCardGrid`
2. `WorkflowContextPanel`
3. `TemplateTile` and `TemplateTileGrid`
4. `SelectionCounterChip`
5. `AspectRatioChipSelect`
6. `OutputGallery`
7. `OutputTileActions`
8. `SingleImageEditorLayout`
9. `GenerationActionBar`
10. `GuidanceStrip`

## Guidance and Smoothing Features
1. Curated templates with category labels and usage intent.
2. Inline guidance callouts:
   - good prompt examples
   - quality hints
   - reference image best practices
3. Demo-guided entry actions:
   - launch in sample mode with prefilled inputs
4. Fallback recommendations:
   - if result confidence is low or output is sparse, show next-step suggestions

## Interaction Standards
1. Hover reveals only contextual actions, never full tool clutter.
2. Selected tile state must be visually distinct and persistent.
3. Generating state should freeze conflicting actions but keep navigation safe.
4. Back actions must preserve state by default unless explicit reset.
5. App-mode navigation keeps the persistent top bar; avoid adding a separate sidebar shell.
6. Ratio selection should support compact dropdown form where space is constrained.
7. Modal interactions (template library) should include backdrop focus treatment.

## Accessibility Requirements
1. All interactive tiles support keyboard activation.
2. Focus rings remain visible against dark surfaces.
3. Tool panel controls have clear labels and error association.
4. Status changes (`Generating`, `Complete`, `Error`) are announced politely.

## Acceptance Criteria
1. Product Shoots and Ad Graphics share at least 70% of studio primitives.
2. Visual and behavior consistency is verifiable across both workflows.
3. Guidance features are discoverable but not intrusive.
4. New components pass lint/typecheck and keyboard navigation checks.
