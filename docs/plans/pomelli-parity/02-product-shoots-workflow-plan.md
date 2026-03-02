# 02 - Product Shoots Workflow Plan

Last updated: 2026-03-03
Status: In progress (immersive app-page refinement)

## Objective
Implement a Pomelli-inspired `Product Shoots` workflow with:
1. dual entry modes
2. guided template flow
3. freeform generate/edit flow
4. iterative result editing

## State Map
1. `PS-ENTRY` (PM-01, PM-13)
2. `PS-GUIDED-COMPOSE` (PM-02, PM-03, PM-06)
3. `PS-TEMPLATE-PICKER` (PM-04, PM-05)
4. `PS-EDIT-SINGLE` (PM-09, PM-10, PM-11, PM-16) as the primary generation workspace
5. `PS-GUIDED-RESULTS` (PM-07, PM-08) as recap/backtrack page from editor

## UX Spec

### 0) Immersive screen discipline (2026-03-03 update)
1. Keep Addreams color palette/tokens.
2. Keep persistent top bar navigation for continuity, but remove landing/footer clutter from core app routes (`/product-shoots`, `/ad-graphics`).
3. Match Pomelli interaction cadence by moving across explicit pages/states.
4. Keep each page focused on one core intent.
5. Use image-first placeholders/templates so layout remains visually dense and tool-light.
6. Reduce nested card/layer wrappers; prefer flatter sections with minimal borders.
7. Use icon-first controls for back/close/edit where possible.

### 1) Entry split
1. Replace single compose surface with two clear cards:
   - `Create a product photoshoot`
   - `Generate or edit an image`
2. Card actions route to separate compose substates while preserving shared result/edit primitives.

### 2) Guided compose
1. Single compose page with:
   - product image upload only (URL input removed)
   - template summary panel that opens full picker
2. Aspect ratio control adjacent to compose cards:
   - `Story (9:16)`
   - `Square (1:1)`
   - `Feed (4:5)`
3. Primary action transitions to editor workspace when product + templates are set.
4. Template picker opens as a large modal overlay with background transparency/blur for focus.

### 3) Template picker
1. Category sections with scroll container.
2. Max selection cap (4 templates).
3. Selection counter (`n/4 selected`) is always visible.
4. Tile states:
   - default
   - hover
   - selected (accent border + check)
   - disabled when cap reached and tile is unselected

### 4) Editor workspace (primary generate loop)
1. Source image remains visible.
2. Prompt toolbar drives first and subsequent generations.
3. Iteration outputs are shown as a horizontal strip below the main workspace and remain selectable.
4. Selected iteration can be used as context for next generation.

### 5) Results recap page
1. Left recap panel:
   - product thumb
   - selected templates
2. Output strip/grid:
   - at least 4 outputs shown when available
3. Global action bar:
   - `Create Campaign`
   - `Add all to Business DNA` (or Addreams equivalent collection/store)
   - `Download`
4. Per-image contextual actions on selected tile:
   - `Edit`
   - save/download/remove (exact labels finalized in UI copy pass)

5. Back from editor (after outputs exist) lands on this recap state.

## Frontend Architecture Plan
1. Add route-level state machine in `frontend/src/routes/studio/product-shoots.tsx`.
2. Split current large component into sub-components:
   - `ProductShootsEntryCards`
   - `GuidedComposePanel`
   - `TemplatePickerDrawer` or page section
   - `ProductShootsResultsGallery`
   - `SingleImageEditorPanel`
3. Use Jotai atoms for:
   - active mode (`guided` or `freeform`)
   - selected templates
   - selected output index
   - editor draft prompt
4. Use TanStack Query for:
   - template catalog fetch
   - mutation lifecycle and cache updates

## API/Contract Plan
1. Guided and freeform generation can initially reuse existing workflow endpoints:
   - text-heavy flow -> `image-from-text`
   - reference-heavy flow -> `image-from-reference`
2. Add request metadata fields for template IDs and mode (non-breaking optional fields).
3. Ensure output supports multi-image arrays and re-edit loops.

## Validation and Guardrails
1. Block generate until required inputs for active mode are complete.
2. Block transition from compose to workspace until product image + templates are selected.
3. Preserve user state on back navigation.
4. Focus first invalid field on submit.
5. Show clear out-of-credits and low-credit states (already exists, preserve).

## Acceptance Criteria
1. User can complete both guided and freeform paths from entry to output.
2. User can select a result image and open editor without losing context.
3. Editor can regenerate and append/update outputs deterministically.
4. Template cap and counter behavior are correct under rapid selection.
5. All states remain keyboard navigable with visible focus.
