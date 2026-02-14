# Phase 2: Atom Migrations

Replace each atom component with its HeroUI equivalent. Each atom is a self-contained PR.

**Prerequisite:** Phase 1 complete (styles imported, tokens mapped, BEM overrides in place)
**Strategy:** Swap one atom at a time. Update direct consumers as needed. Run typecheck + visual verify.

---

## Step 2.1: Delete SquircleSurface

**Ref:** [E1 in easy-refactorings.md](./03-easy-refactorings.md#e1-squirclesurface--css-corner-shape-delete-component)

### Actions

1. **Delete** `atoms/SquircleSurface.tsx`
2. **Delete** `lib/squircle.ts`
3. **Find all imports** of `SquircleSurface` across the codebase and replace with direct `rounded-*` classes

### Import sites (exhaustive list from codebase)

| Consumer File | Usage | Replacement |
|--------------|-------|-------------|
| `atoms/PillButton.tsx` | `<SquircleSurface asChild radius="xxl" smooth="xl">` | Add `rounded-2xl` to inner element |
| `atoms/TextField.tsx` | `<SquircleSurface asChild radius="lg" smooth="md">` | Add `rounded-lg` to `<input>` |
| `atoms/TextareaField.tsx` | `<SquircleSurface asChild radius="lg" smooth="md">` | Add `rounded-lg` to `<textarea>` |
| `atoms/SelectField.tsx` | `<SquircleSurface asChild radius="lg" smooth="md">` | Add `rounded-lg` to `<select>` |
| `atoms/ToggleField.tsx` | 3 usages (outer, track, thumb) | Add `rounded-lg`, `rounded-xl`, `rounded-xl` respectively |
| `atoms/Frame.tsx` | `<SquircleSurface asChild radius="xl" smooth="lg">` | Add `rounded-xl` to inner element |
| `atoms/FrameCanvas.tsx` | `<SquircleSurface asChild radius="xl" smooth="lg">` | Add `rounded-xl` to inner div |
| `atoms/MetadataChip.tsx` | `<SquircleSurface asChild radius="xl" smooth="lg">` | Add `rounded-xl` to `<span>` |
| `molecules/ImageDropzone.tsx` | 2 usages (zone, button) | Add `rounded-lg`, `rounded-xl` |
| `molecules/ProgressStepper.tsx` | 4 usages (bar, card, badge) | Add `rounded-2xl`, `rounded-xl`, `rounded-lg` |
| `molecules/WorkflowTabs.tsx` | Per tab | Add `rounded-xl` to `<NavLink>` |
| `molecules/ReferenceImageInputTabs.tsx` | Per tab button | Add `rounded-xl` to `<button>` |

### Verification

After this step:
- `npm run typecheck` — no references to SquircleSurface remain
- `npm run dev` — visually identical in Chrome (CSS corner-shape handles squircle)
- All components still render correctly

> **Note:** This is the largest single step because SquircleSurface is used everywhere. It can be done as one PR since the change is mechanical (remove wrapper, add class).

---

## Step 2.2: Migrate PillButton → HeroUI Button

**Ref:** [E2 in easy-refactorings.md](./03-easy-refactorings.md#e2-pillbutton--heroui-button)

### Actions

1. **Rewrite** `atoms/PillButton.tsx` to wrap HeroUI `Button`
2. **Map** `tone` prop → HeroUI `variant` (primary→primary, secondary→secondary, neutral→ghost)
3. **Remove** `@radix-ui/react-slot` import and `asChild` pattern

### Consumer updates needed

| File | Change |
|------|--------|
| `molecules/GenerateButton.tsx` | `disabled` → `isDisabled` |
| `molecules/ImagePreviewCard.tsx` | `onClick` → `onPress` |
| `organisms/StudioStepperLayout.tsx` | `onClick` → `onPress`, `disabled` → `isDisabled` |
| `layouts/AppShellLayout.tsx` | Remove `asChild` + `<NavLink>` wrapping; use styled `NavLink`/HeroUI `Link` for navigation |

### AppShellLayout special case

Current:
```tsx
<PillButton tone="primary" asChild>
  <NavLink to="/product-shoots">Build your visual</NavLink>
</PillButton>
```

After (option A — keep semantic navigation with styled `NavLink`):
```tsx
<NavLink to="/product-shoots" className="button button--primary rounded-2xl px-5 py-2.5 text-sm font-semibold">
  Build your visual
</NavLink>
```

After (option B — keep React Router `NavLink`, apply HeroUI-style classes directly):
```tsx
<NavLink to="/product-shoots" className="button button--primary rounded-2xl px-5 py-2.5 text-sm font-semibold">
  Build your visual
</NavLink>
```

Option A is simpler in this app because routes already use `NavLink`.

---

## Step 2.3: Migrate TextField → HeroUI TextField compound

**Ref:** [E3 in easy-refactorings.md](./03-easy-refactorings.md#e3-textfield--heroui-textfield-compound)

### Actions

1. **Rewrite** `atoms/TextField.tsx` with HeroUI `TextField`, `Label`, `Input`, `Description`, `FieldError`
2. **Preserve** the same external API: `{ id, label, helperText, error, ...inputProps }`
3. **Remove** manual `aria-invalid`, `aria-describedby`, `aria-live` — React Aria handles these

### Consumer impact

All consumers pass the same props (`id`, `label`, `value`, `onChange`, `error`, etc.) so **no consumer changes** are needed if we keep the wrapper's API stable.

**onChange behavior:** HeroUI `Input` fires standard `React.ChangeEvent<HTMLInputElement>`. The current consumers already use `event.target.value`, so no change needed.

### Verify

- SeedInput renders correctly with helper text
- AdGraphicsPanel URL input renders with error state
- Custom width/height fields render correctly

---

## Step 2.4: Migrate TextareaField → HeroUI TextField + TextArea

**Ref:** [E4 in easy-refactorings.md](./03-easy-refactorings.md#e4-textareafield--heroui-textfield--textarea)

### Actions

Identical pattern to 2.3 but uses `TextArea` instead of `Input`.

### Consumer impact

None — same API preserved.

---

## Step 2.5: Migrate ToggleField → HeroUI Switch

**Ref:** [E5 in easy-refactorings.md](./03-easy-refactorings.md#e5-togglefield--heroui-switch)

### Actions

1. **Rewrite** `atoms/ToggleField.tsx` with HeroUI `Switch`
2. **API change:** `checked` → `isSelected`, `onChange` signature changes

### Critical: Consumer API change

Current consumers use the native checkbox pattern:
```tsx
<ToggleField checked={value} onChange={(event) => handler(event.target.checked)} />
```

After:
```tsx
<ToggleField checked={value} onChange={(isSelected) => handler(isSelected)} />
```

**The wrapper can absorb this change** by mapping internally:

```tsx
export function ToggleField({ id, label, helperText, checked, onChange, ...props }) {
  return (
    <Switch
      id={id}
      isSelected={checked}
      onChange={onChange}  // (isSelected: boolean) => void
      {...props}
    >
      ...
    </Switch>
  );
}
```

**Consumers that need updating:**

| File | Current onChange | After |
|------|----------------|-------|
| `PromptExtendToggle` | `onChange={(next) => handler(next)}` | No change (already receives boolean) |
| `WatermarkToggle` | `onChange={(next) => handler(next)}` | No change |
| `AdGraphicsPanel` (custom size toggle) | `onChange={(event) => handler(event.target.checked ? "custom" : "preset")}` | `onChange={(isSelected) => handler(isSelected ? "custom" : "preset")}` |

Only AdGraphicsPanel needs a change because it directly reads `event.target.checked`.

---

## Step 2.6: Migrate SelectField → HeroUI Select

**Ref:** [C1 in complex-refactorings.md](./04-complex-refactorings.md#c1-selectfield--heroui-select-compound-component)

### Actions

1. **Rewrite** `atoms/SelectField.tsx` with HeroUI `Select`, `Label`, `ListBox` (`ListBox.Item`), `Description`, `FieldError`
2. **API change:** `onChange` now receives `(value: string)` instead of `ChangeEvent<HTMLSelectElement>`

### Consumer updates

| File | Current | After |
|------|---------|-------|
| `SizePresetSelect` | `onChange={(event) => onChange(event.target.value)}` | `onChange={(value) => onChange(value)}` |
| `OutputFormatSelect` | `onChange={(event) => onChange(event.target.value)}` | `onChange={(value) => onChange(value)}` |

---

## Step 2.7: Migrate Frame → HeroUI Card

**Ref:** [E6 in easy-refactorings.md](./03-easy-refactorings.md#e6-frame--heroui-card)

### Actions

1. **Rewrite** `atoms/Frame.tsx` to wrap HeroUI `Card`
2. BEM override in `index.css` already handles the shadow styling
3. **Drop** polymorphic `as` prop (check if any consumer uses it)

### Consumer check

Grep for `<Frame as=` — if no results, safely drop `as` prop. If results exist, use `Card` with appropriate wrapper element.

---

## Step 2.8: Migrate FrameCanvas → Skeleton composition

**Ref:** [E7 in easy-refactorings.md](./03-easy-refactorings.md#e7-framecanvas--heroui-skeleton)

---

## Step 2.9: Migrate MetadataChip → HeroUI Chip

**Ref:** [E8 in easy-refactorings.md](./03-easy-refactorings.md#e8-metadatachip--heroui-chip)

---

## Step 2.10: Migrate SectionShell → Card composition

**Ref:** [E16 in easy-refactorings.md](./03-easy-refactorings.md#e16-sectionshell--card-composition)

---

## Phase 2 Checklist

- [ ] 2.1 — SquircleSurface deleted, all consumers updated with `rounded-*`
- [ ] 2.2 — PillButton → HeroUI Button
- [ ] 2.3 — TextField → HeroUI TextField compound
- [ ] 2.4 — TextareaField → HeroUI TextField + TextArea
- [ ] 2.5 — ToggleField → HeroUI Switch
- [ ] 2.6 — SelectField → HeroUI Select
- [ ] 2.7 — Frame → HeroUI Card
- [ ] 2.8 — FrameCanvas → Skeleton
- [ ] 2.9 — MetadataChip → Chip
- [ ] 2.10 — SectionShell → Card composition

### After each step

1. `npm run typecheck` — passes
2. `npm run dev` — visual verification
3. `npm run build` — builds successfully
4. No regressions in existing functionality

**Next:** [Phase 3 — Molecule Migrations](./07-phase-3-molecules.md)
