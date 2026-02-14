# Component Index

Full inventory of every frontend component, its current implementation, dependencies, and migration target.

## File Structure

```
frontend/src/
├── components/
│   ├── atoms/           ← 10 base components (all migrate to HeroUI)
│   ├── molecules/       ← 11 composite components (most become thin HeroUI wrappers)
│   ├── organisms/       ← 12 page sections (benefit transitively, some adopt HeroUI patterns)
│   └── layouts/         ← 3 layout shells (minor updates)
├── features/
│   └── parameters/
│       ├── constants.ts         ← Shared constants (unchanged)
│       └── components/          ← 8 barrel re-exports to molecules (update targets)
├── lib/
│   ├── cn.ts                    ← className joiner (kept)
│   ├── squircle.ts              ← Squircle config (removed)
│   ├── stepper.ts               ← Step status logic (unchanged)
│   └── focus-first-error.ts     ← Focus utility (kept for step-driven route validation)
└── index.css                    ← Theme tokens (extended with HeroUI + corner-shape)
```

---

## Atoms

| # | Component | File | SquircleSurface? | Dependencies | HeroUI Target | Difficulty |
|---|-----------|------|------------------|-------------|---------------|------------|
| A1 | `SquircleSurface` | `atoms/SquircleSurface.tsx` | IS the wrapper | `@squircle-js/react`, `lib/squircle.ts`, `lib/cn.ts` | **Deleted** — replaced by CSS `corner-shape` | Easy |
| A2 | `PillButton` | `atoms/PillButton.tsx` | Yes (wraps) | `SquircleSurface`, `@radix-ui/react-slot`, `lib/cn.ts` | `Button` | Easy |
| A3 | `TextField` | `atoms/TextField.tsx` | Yes (wraps input) | `SquircleSurface`, `lib/cn.ts` | `TextField` compound (`Label` + `Input` + `Description` + `FieldError`) | Easy |
| A4 | `TextareaField` | `atoms/TextareaField.tsx` | Yes (wraps textarea) | `SquircleSurface`, `lib/cn.ts` | `TextField` compound with `TextArea` | Easy |
| A5 | `SelectField` | `atoms/SelectField.tsx` | Yes (wraps select) | `SquircleSurface`, `lib/cn.ts` | `Select` compound | Medium |
| A6 | `ToggleField` | `atoms/ToggleField.tsx` | Yes (3 layers) | `SquircleSurface`, `lib/cn.ts` | `Switch` | Easy |
| A7 | `Frame` | `atoms/Frame.tsx` | Yes (wraps) | `SquircleSurface`, `lib/cn.ts` | `Card` or `Surface` | Easy |
| A8 | `FrameCanvas` | `atoms/FrameCanvas.tsx` | Yes (nested) | `Frame`, `SquircleSurface` | `Skeleton` with custom gradient | Easy |
| A9 | `MetadataChip` | `atoms/MetadataChip.tsx` | Yes (wraps span) | `SquircleSurface` | `Chip` | Easy |
| A10 | `SectionShell` | `atoms/SectionShell.tsx` | Via Frame | `Frame` | `Card` with custom header composition | Easy |

---

## Molecules

| # | Component | File | Wraps Atom | HeroUI Target | Difficulty |
|---|-----------|------|-----------|---------------|------------|
| M1 | `PromptTextarea` | `molecules/PromptTextarea.tsx` | `TextareaField` | `TextField` + `TextArea` + char counter in `Description` slot | Medium |
| M2 | `NegativePromptTextarea` | `molecules/NegativePromptTextarea.tsx` | `TextareaField` | Same as M1 | Easy |
| M3 | `EditInstructionTextarea` | `molecules/EditInstructionTextarea.tsx` | `PromptTextarea` | Same as M1 (re-labels) | Easy |
| M4 | `SeedInput` | `molecules/SeedInput.tsx` | `TextField` | `NumberField` or `TextField` + `Input` with `inputMode="numeric"` | Easy |
| M5 | `SizePresetSelect` | `molecules/SizePresetSelect.tsx` | `SelectField` | `Select` with items from `QWEN_SIZE_PRESETS` | Medium |
| M6 | `OutputFormatSelect` | `molecules/OutputFormatSelect.tsx` | `SelectField` | `Select` with items from `OUTPUT_FORMATS` | Medium |
| M7 | `PromptExtendToggle` | `molecules/PromptExtendToggle.tsx` | `ToggleField` | `Switch` with label + description | Easy |
| M8 | `WatermarkToggle` | `molecules/WatermarkToggle.tsx` | `ToggleField` | `Switch` with label + description | Easy |
| M9 | `GenerateButton` | `molecules/GenerateButton.tsx` | `PillButton` | `Button` with `isPending` | Easy |
| M10 | `ImageDropzone` | `molecules/ImageDropzone.tsx` | `SquircleSurface` | Custom (use `Surface` + `Button` internally) | Medium |
| M11 | `ImagePreviewCard` | `molecules/ImagePreviewCard.tsx` | `Frame`, `PillButton` | `Card` + `Button` composition | Easy |
| M12 | `WorkflowTabs` | `molecules/WorkflowTabs.tsx` | `SquircleSurface` | `Tabs` (with React Router integration) | Medium |
| M13 | `ReferenceImageInputTabs` | `molecules/ReferenceImageInputTabs.tsx` | `SquircleSurface` | `Tabs` (controlled) | Medium |
| M14 | `ProgressStepper` | `molecules/ProgressStepper.tsx` | `SquircleSurface` | Custom (uses `Tabs`-like pattern with step badges) | Complex |
| M15 | `ValidationSummary` | `molecules/ValidationSummary.tsx` | `Frame` | `Alert` or `Card` with check list | Easy |
| M16 | `StepHeader` | `molecules/StepHeader.tsx` | None | Semantic HTML (no HeroUI needed) | N/A |
| M17 | `ResultMetadataChips` | `molecules/ResultMetadataChips.tsx` | `MetadataChip` | Loop of `Chip` components | Easy |
| M18 | `RouteLoadingFrame` | `molecules/RouteLoadingFrame.tsx` | `FrameCanvas` | `Skeleton` | Easy |

---

## Organisms

| # | Component | File | Atoms/Molecules Used | Migration Impact |
|---|-----------|------|---------------------|-----------------|
| O1 | `ProductShootsForm` | `organisms/ProductShootsForm.tsx` | PromptTextarea, NegativePromptTextarea, SizePresetSelect, OutputFormatSelect, SeedInput, PromptExtendToggle, WatermarkToggle, GenerateButton | **Medium** — manual accordion → HeroUI `Disclosure`; benefits transitively from atom swaps |
| O2 | `AdGraphicsPanel` | `organisms/AdGraphicsPanel.tsx` | ReferenceImageInputTabs, TextField, ImageDropzone, ImagePreviewCard, EditInstructionTextarea, NegativePromptTextarea, ToggleField, SizePresetSelect, SeedInput, PromptExtendToggle, WatermarkToggle, GenerateButton | **Medium** — most complex form; benefits transitively; tab switching becomes HeroUI `Tabs` |
| O3 | `GenerationResultFrame` | `organisms/GenerationResultFrame.tsx` | FrameCanvas, ResultMetadataChips | **Low** — swap FrameCanvas → Skeleton |
| O4 | `EditedImageResultFrame` | `organisms/EditedImageResultFrame.tsx` | FrameCanvas, ResultMetadataChips | **Low** — same as O3 |
| O5 | `ResultPanel` | `organisms/ResultPanel.tsx` | FrameCanvas, Frame, PillButton | **Low** — swap Frame → Card, PillButton → Button |
| O6 | `WorkflowReviewPanel` | `organisms/WorkflowReviewPanel.tsx` | Frame, ValidationSummary | **Low** — swap Frame → Card |
| O7 | `StudioStepperLayout` | `organisms/StudioStepperLayout.tsx` | Frame, PillButton, ProgressStepper, StepHeader | **Medium** — Frame → Card, PillButton → Button, ProgressStepper carries over |
| O8 | `LandingHero` | `organisms/LandingHero.tsx` | Frame | **Low** — swap Frame → Card |
| O9 | `LandingFooterCta` | `organisms/LandingFooterCta.tsx` | Frame | **Low** |
| O10 | `LandingValueSection` | `organisms/LandingValueSection.tsx` | Frame | **Low** |
| O11 | `LandingProofSection` | `organisms/LandingProofSection.tsx` | Frame | **Low** |
| O12 | `LandingWorkflowSplit` | `organisms/LandingWorkflowSplit.tsx` | Frame | **Low** |

---

## Layouts

| # | Component | File | Uses | Migration Impact |
|---|-----------|------|------|-----------------|
| L1 | `AppShellLayout` | `layouts/AppShellLayout.tsx` | Frame, PillButton, NavLink | **Medium** — swap Frame → Card, PillButton → Button; optionally adopt HeroUI nav |
| L2 | `StudioLayout` | `layouts/StudioLayout.tsx` | Frame, WorkflowTabs | **Low** — benefits transitively |
| L3 | `LandingSection` | `layouts/LandingSection.tsx` | None | **None** — pure layout wrapper |

---

## Barrel Exports

### `components/ui/`

Transitional `components/ui/*` shim re-exports were deleted during final cleanup after consumers moved to direct atom/molecule imports.

### `features/parameters/components/` (8 files)

All are barrel re-exports pointing to `../../components/molecules/*`. These continue to work as-is since molecule file paths don't change — only internals do.

---

## Utility Files

| File | Current Purpose | Post-Migration |
|------|----------------|---------------|
| `lib/cn.ts` | `cn(...classes)` — filters falsy, joins with space | **Keep** (still useful for conditional classes on HeroUI `className` props) |
| `lib/squircle.ts` | Radius/smoothing presets for `@squircle-js/react` | **Delete** |
| `lib/stepper.ts` | `deriveStepStatuses()`, `canNavigateToStep()` | **Keep** (pure logic, no UI dependency) |
| `lib/focus-first-error.ts` | `focusFirstError()` — manual focus + scroll to first invalid field | **Keep for now** — current step-driven route validation uses this utility directly |

---

## Dependency Changes

### Remove

| Package | Reason |
|---------|--------|
| `@squircle-js/react` | Replaced by CSS `corner-shape: squircle` |
| `@radix-ui/react-slot` | Only used by PillButton's `asChild`; HeroUI has its own composition model |

### Add

| Package | Purpose |
|---------|---------|
| `@heroui/react` | Component library (includes React Aria) |
| `@heroui/styles` | Required global styles/theme variables import for HeroUI components |

### Unchanged

| Package | Notes |
|---------|-------|
| `react`, `react-dom` | v19 — compatible with HeroUI v3 |
| `tailwindcss` | v4 — compatible with HeroUI v3 |
| `jotai`, `bunshi`, `@tanstack/react-query` | State management — untouched |
| `react-router-dom` | Routing — untouched (WorkflowTabs integration needs care) |
