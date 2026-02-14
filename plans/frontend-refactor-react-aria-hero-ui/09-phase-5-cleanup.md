# Phase 5: Cleanup

Remove dead code, old dependencies, unused files, and verify the final state of the codebase.

**Prerequisite:** Phase 4 complete, all components migrated and visually verified

---

## Step 5.1: Remove `@squircle-js/react` dependency

```bash
cd frontend
npm uninstall @squircle-js/react
```

### Verify

- `npm run build` — no import errors
- Grep for `@squircle-js` or `squircle` in `src/` — zero results (except possibly CSS comments)

---

## Step 5.2: Remove `@radix-ui/react-slot` dependency

Only used by the old PillButton's `asChild` pattern.

```bash
npm uninstall @radix-ui/react-slot
```

### Verify

- Grep for `@radix-ui/react-slot` or `Slot` in `src/` — zero results
- `npm run typecheck` — passes

---

## Step 5.3: Delete dead files

| File | Reason |
|------|--------|
| `lib/squircle.ts` | Squircle radius/smoothing presets — replaced by CSS `--radius-*` tokens |
| `atoms/SquircleSurface.tsx` | Wrapper component — deleted in Phase 2, Step 2.1 |

### Evaluate for deletion

| File | Decision |
|------|----------|
| `lib/focus-first-error.ts` | **Keep for now:** current step-driven validation in studio routes uses this utility directly. Re-evaluate only after migrating those flows to HeroUI `<Form>` invalid handling. |
| `lib/cn.ts` | **Keep** — still used for conditional className composition on HeroUI components |

### Check focus-first-error usage

Grep for `focusFirstError` in `src/`:

```
frontend/src/routes/studio/product-shoots.tsx
frontend/src/routes/studio/ad-graphics.tsx
```

If/when those routes are refactored to HeroUI `Form` + native invalid flow, then remove route-level `focusFirstError` calls and delete the file.

With custom step validation (current behavior), `focusFirstError` remains useful. Keep until the validation architecture changes.

---

## Step 5.4: Clean up old CSS tokens

Edit `frontend/src/index.css`:

### Remove deprecated squircle tokens

```css
@theme {
  /* DELETE these lines: */
  --sq-radius-sm: 12;
  --sq-radius-md: 18;
  --sq-radius-lg: 24;
  --sq-radius-xl: 32;

  --sq-smooth-sm: 0.82;
  --sq-smooth-md: 0.88;
  --sq-smooth-lg: 0.94;
}
```

These were left during Phase 1 to avoid breaking old components. Now that all consumers use `--radius-*` tokens, remove the old ones.

---

## Step 5.5: Update barrel exports

### `components/ui/` barrel files

After migration, some barrel exports may point to wrapper files that are now trivially thin. Evaluate whether to:

**Option A:** Keep wrappers (recommended for now) — maintains stable import paths, wrappers add no runtime cost.

**Option B:** Re-export HeroUI directly:

```ts
// components/ui/TextField.ts
export { TextField, Label, Input, Description, FieldError } from "@heroui/react";
```

This is cleaner but changes the consumer API (compound components instead of flat props). Since the atoms already wrap HeroUI components, Option A is simpler.

### `features/parameters/components/` barrel files

These re-export molecules:
```ts
// features/parameters/components/prompt-textarea.ts
export { PromptTextarea } from "../../../components/molecules/PromptTextarea";
```

No change needed — the molecule file paths haven't changed, only their internals.

---

## Step 5.6: Final verification

### Build

```bash
npm run typecheck  # TypeScript clean
npm run build      # Production build succeeds
```

### Bundle analysis

Compare bundle size before and after:

```bash
# Before migration (from git stash or branch)
npm run build
ls -la dist/assets/*.js

# After migration
npm run build
ls -la dist/assets/*.js
```

Expected:
- `@squircle-js/react` removed (~15KB)
- `@radix-ui/react-slot` removed (~2KB)
- `@heroui/react` + `react-aria-components` added (~30-60KB depending on tree-shaking)
- Net change: roughly +15-45KB (acceptable for the accessibility and DX gains)

### Visual regression check

Test every page/flow:

| Page | What to verify |
|------|---------------|
| Landing page (`/`) | Hero, value section, proof section, workflow split, footer CTA render correctly |
| Product Shoots (`/product-shoots`) | Form renders, advanced options toggle, all fields work, submit triggers mutation |
| Ad Graphics (`/ad-graphics`) | Tab switching, upload dropzone, URL input, image preview, form submission |
| Navigation | Mobile menu, desktop nav, active states, skip-to-content link |

### Accessibility audit

1. **Keyboard navigation:** Tab through entire Product Shoots form. Every field should be reachable, focusable, and have visible focus ring.
2. **Screen reader:** Use NVDA or VoiceOver. Labels should be announced, errors should be announced on change (aria-live), tab roles should be announced.
3. **Disclosure:** Keyboard open/close of advanced options with Enter/Space.
4. **Select:** Arrow keys to navigate options, Enter to select, Escape to close.

### Cross-browser

| Browser | Expected |
|---------|----------|
| Chrome 139+ | Full squircle corners, all components render correctly |
| Firefox latest | Standard rounded corners, all components render correctly |
| Safari latest | Standard rounded corners, all components render correctly |
| Mobile Chrome | Responsive layout, squircle corners |
| Mobile Safari | Responsive layout, standard corners |

---

## Step 5.7: Update CLAUDE.md (if desired)

Update project instructions to reflect the new component library:

```diff
- @squircle-js/react for smooth corners
+ @heroui/react (React Aria) for UI components
+ CSS corner-shape: squircle for smooth corners (progressive enhancement)
```

---

## Final State Summary

### Files removed
- `atoms/SquircleSurface.tsx`
- `lib/squircle.ts`
- `lib/focus-first-error.ts` (if React Aria handles it)

### Files rewritten (atoms)
- `atoms/PillButton.tsx` — wraps HeroUI Button
- `atoms/TextField.tsx` — wraps HeroUI TextField compound
- `atoms/TextareaField.tsx` — wraps HeroUI TextField + TextArea
- `atoms/SelectField.tsx` — wraps HeroUI Select compound
- `atoms/ToggleField.tsx` — wraps HeroUI Switch
- `atoms/Frame.tsx` — wraps HeroUI Card
- `atoms/FrameCanvas.tsx` — wraps HeroUI Skeleton
- `atoms/MetadataChip.tsx` — wraps HeroUI Chip
- `atoms/SectionShell.tsx` — composes HeroUI Card

### Files updated (molecules)
- All 18 molecules updated to use new atom APIs
- Key structural changes: PromptTextarea, WorkflowTabs, ReferenceImageInputTabs, ImageDropzone

### Files updated (organisms)
- `ProductShootsForm.tsx` — Disclosure for accordion
- `AdGraphicsPanel.tsx` — ToggleField onChange, raw buttons → Button
- `StudioStepperLayout.tsx` — Card + Button
- All result/landing organisms — Frame → Card
- `AppShellLayout.tsx` — Card + Disclosure for mobile nav

### Dependencies
- **Added:** `@heroui/react`
- **Removed:** `@squircle-js/react`, `@radix-ui/react-slot`

### CSS changes
- Added `--radius-*` tokens
- Added global `corner-shape: squircle` under `@supports`
- Added HeroUI CSS variable mapping
- Added BEM class overrides in `@layer components`
- Added `[data-focus-visible]` focus ring rule
- Removed `--sq-radius-*` and `--sq-smooth-*` tokens
