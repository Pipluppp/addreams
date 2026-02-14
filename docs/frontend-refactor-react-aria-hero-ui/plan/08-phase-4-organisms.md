# Phase 4: Organism & Layout Migrations

Adopt HeroUI patterns in organisms and layouts. Most organisms benefit transitively from Phase 2–3 atom/molecule swaps. This phase handles the structural changes: accordion → Disclosure, manual nav → Disclosure, and updating any remaining raw HTML buttons/links to HeroUI components.

**Prerequisite:** Phase 3 complete (all molecules migrated)

---

## Step 4.1: ProductShootsForm — Accordion → HeroUI Disclosure

**Ref:** [C8 in complex-refactorings.md](./04-complex-refactorings.md#c8-productshootsform--adopt-heroui-disclosure-for-accordion)
**File:** `organisms/ProductShootsForm.tsx`

### Current manual accordion

```tsx
const [advancedOpen, setAdvancedOpen] = useState(false);

<button type="button"
  onClick={() => setAdvancedOpen((c) => !c)}
  aria-expanded={advancedOpen}
  aria-controls="product-advanced-options"
>
  Advanced options {advancedOpen ? "-" : "+"}
</button>

{advancedOpen ? (
  <div id="product-advanced-options" className="grid gap-4 md:grid-cols-2">
    {/* NegativePromptTextarea, SizePresetSelect, OutputFormatSelect, SeedInput, toggles */}
  </div>
) : null}
```

### After: HeroUI Disclosure

```tsx
import { Disclosure } from "@heroui/react";

// Remove: const [advancedOpen, setAdvancedOpen] = useState(false);

<div className="space-y-3 bg-canvas p-4">
  <Disclosure>
    <Disclosure.Heading>
      <Disclosure.Trigger className="inline-flex items-center text-sm font-semibold uppercase tracking-[0.08em] text-ink transition-colors duration-200 hover:text-accent-primary">
        Advanced options
        <Disclosure.Indicator className="ml-1" />
      </Disclosure.Trigger>
    </Disclosure.Heading>
    <Disclosure.Content>
      <Disclosure.Body className="grid gap-4 pt-3 md:grid-cols-2">
        <div className="md:col-span-2">
          <NegativePromptTextarea ... />
        </div>
        <SizePresetSelect ... />
        <OutputFormatSelect ... />
        <SeedInput ... />
        <div className="space-y-3">
          <PromptExtendToggle ... />
          <WatermarkToggle ... />
        </div>
      </Disclosure.Body>
    </Disclosure.Content>
  </Disclosure>
</div>
```

### Also update: "Reuse settings" button

Current:
```tsx
<button type="button" onClick={onReuseSettings}
  className="bg-surface px-4 py-2 text-sm font-semibold text-ink ...">
  Reuse settings
</button>
```

After:
```tsx
<Button variant="ghost" onPress={onReuseSettings}>
  Reuse settings
</Button>
```

### Changes summary
- Remove `useState(false)` for `advancedOpen`
- Remove manual `aria-expanded` and `aria-controls`
- Replace conditional render with `Disclosure.Content`
- Replace raw `<button>` with HeroUI `Button`

---

## Step 4.2: AdGraphicsPanel — Transitive benefits + raw button cleanup

**File:** `organisms/AdGraphicsPanel.tsx`

### Transitive benefits (no code changes needed)

All form molecules used by AdGraphicsPanel are already migrated:
- `ReferenceImageInputTabs` → HeroUI Tabs (Phase 3)
- `TextField` → HeroUI TextField (Phase 2)
- `ImageDropzone` → Surface + Button (Phase 3)
- `ImagePreviewCard` → Card + Button (Phase 3)
- `EditInstructionTextarea` → TextField + TextArea (Phase 3)
- `NegativePromptTextarea` → TextField + TextArea (Phase 3)
- `ToggleField` → Switch (Phase 2)
- `SizePresetSelect` → Select (Phase 3)
- `SeedInput` → TextField (Phase 3)
- `PromptExtendToggle` / `WatermarkToggle` → Switch (Phase 3)
- `GenerateButton` → Button (Phase 3)

### Manual updates needed

**ToggleField onChange in AdGraphicsPanel** — the custom size mode toggle:

Current:
```tsx
<ToggleField id="custom-size-toggle"
  label="Custom size mode"
  helperText="Enable manual width/height constraints for image edit output."
  checked={values.sizeMode === "custom"}
  onChange={(event) => onChange({ ...values, sizeMode: event.target.checked ? "custom" : "preset" })}
/>
```

After (ToggleField now uses Switch API):
```tsx
<ToggleField id="custom-size-toggle"
  label="Custom size mode"
  helperText="Enable manual width/height constraints for image edit output."
  checked={values.sizeMode === "custom"}
  onChange={(isSelected) => onChange({ ...values, sizeMode: isSelected ? "custom" : "preset" })}
/>
```

**"Clear form" raw button:**

Current:
```tsx
<button type="button" onClick={onClearForm}
  className="bg-surface px-4 py-2 text-sm font-semibold text-ink ...">
  Clear form
</button>
```

After:
```tsx
<Button variant="ghost" onPress={onClearForm}>
  Clear form
</Button>
```

---

## Step 4.3: StudioStepperLayout — Frame → Card, PillButton → Button

**File:** `organisms/StudioStepperLayout.tsx`

### Changes

1. Replace `Frame` import with `Card`:

```tsx
// Before
import { Frame } from "../atoms/Frame";
import { PillButton } from "../atoms/PillButton";

// After
import { Card } from "@heroui/react";
import { Button } from "@heroui/react";
```

2. Replace usages:

```tsx
// Main container
<Card className="space-y-6 p-5 sm:p-7">
  <StepHeader ... />
  <ProgressStepper ... />
  <div>{children}</div>
</Card>

// Sticky action bar
<div className="sticky bottom-3 z-20">
  <Card className="bg-surface/95 p-3 shadow-[0_10px_36px_color-mix(in_srgb,var(--color-ink)_10%,transparent)] backdrop-blur">
    <div className="flex items-center justify-between gap-3">
      <Button variant="ghost" onPress={onBack} isDisabled={!canBack}>Back</Button>
      <Button variant={primaryActionTone} onPress={onPrimaryAction}
        isDisabled={isPrimaryDisabled || isPrimaryPending}>
        {isPrimaryPending ? primaryActionPendingLabel : primaryActionLabel}
      </Button>
    </div>
  </Card>
</div>
```

---

## Step 4.4: Result Frames — FrameCanvas → Skeleton, Frame → Card

**Files:**
- `organisms/GenerationResultFrame.tsx`
- `organisms/EditedImageResultFrame.tsx`
- `organisms/ResultPanel.tsx`
- `organisms/WorkflowReviewPanel.tsx`

These are display-only components. Changes are mechanical:
- `Frame` → `Card`
- `FrameCanvas` → already migrated to Skeleton wrapper
- `PillButton` → `Button`

No structural changes needed.

---

## Step 4.5: Landing Page Organisms — Frame → Card

**Files:**
- `organisms/LandingHero.tsx`
- `organisms/LandingFooterCta.tsx`
- `organisms/LandingValueSection.tsx`
- `organisms/LandingProofSection.tsx`
- `organisms/LandingWorkflowSplit.tsx`

All of these use `Frame` as a card wrapper. Replace with `Card` import.

### LandingHero special cases

**React Router Links styled as buttons:**
```tsx
// Before
<Link to="/product-shoots" className="inline-flex items-center ... bg-accent-primary ...">
  Get started
</Link>

// After — keep as styled Link (these are navigation, not actions)
<Link to="/product-shoots" className="button button--primary rounded-2xl px-5 py-2.5 text-sm font-semibold">
  Get started
</Link>
```

Using BEM classes (`button button--primary`) on a `<Link>` gives it button styling without needing HeroUI Button component. This is valid since these are navigation links.

---

## Step 4.6: AppShellLayout — Card + Button + Disclosure for mobile nav

**Ref:** [C9 in complex-refactorings.md](./04-complex-refactorings.md#c9-appshelllayout-mobile-nav--heroui-disclosure)
**File:** `layouts/AppShellLayout.tsx`

### Changes

1. `Frame` → `Card`
2. Mobile menu toggle → HeroUI Disclosure (controlled)
3. Footer CTA `PillButton asChild` → styled `NavLink` or HeroUI `Link`

### Mobile nav after

```tsx
import { Disclosure } from "@heroui/react";
import { Card } from "@heroui/react";

export function AppShellLayout() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <a href="#main-content" className="sr-only focus:not-sr-only ...">Skip to main content</a>

      <header className="container-shell py-4">
        <Card className="px-4 py-3 sm:px-5">
          <div className="flex items-center justify-between gap-3">
            <NavLink to="/" className="section-title ...">
              <img src="/brand/logo.svg" alt="" aria-hidden="true" ... />
              <span>addreams</span>
            </NavLink>

            {/* Mobile menu — HeroUI Disclosure */}
            <Disclosure isExpanded={menuOpen} onExpandedChange={setMenuOpen} className="md:hidden">
              <Disclosure.Heading>
                <Disclosure.Trigger className="bg-surface px-3 py-1.5 text-xs font-semibold text-ink rounded-lg"
                  aria-label="Toggle navigation">
                  Menu
                </Disclosure.Trigger>
              </Disclosure.Heading>
              <Disclosure.Content>
                <Disclosure.Body>
                  <nav className="mt-3 flex flex-col gap-2 pt-3">
                    {navItems.map((item) => (
                      <NavLink key={item.to} to={item.to}
                        className={({ isActive }) => cn("px-3 py-2 text-sm rounded-lg ...",
                          isActive ? "text-accent-primary" : "text-ink-soft")}
                        onClick={() => setMenuOpen(false)}
                      >{item.label}</NavLink>
                    ))}
                  </nav>
                </Disclosure.Body>
              </Disclosure.Content>
            </Disclosure>

            {/* Desktop nav — unchanged */}
            <nav className="hidden items-center gap-2 md:flex">
              {navItems.map(...)}
            </nav>
          </div>
        </Card>
      </header>

      <main id="main-content"><Outlet /></main>

      <footer>
        {/* Footer CTA */}
        <section className="container-shell py-14">
          <div className="grid gap-7 md:grid-cols-[1fr_auto] md:items-center">
            <div className="space-y-4">
              <h2 className="section-title ...">Seen enough? Build your next ad visual now.</h2>
              <p ...>Start with Product Shoots or Ad Graphics...</p>
            </div>
            <NavLink to="/product-shoots"
              className="button button--primary rounded-2xl px-5 py-2.5 text-sm font-semibold">
              Build your visual
            </NavLink>
          </div>
        </section>
        {/* ... rest of footer unchanged ... */}
      </footer>
    </div>
  );
}
```

---

## Step 4.7: StudioLayout — Transitive benefits

**File:** `layouts/StudioLayout.tsx`

`Frame` → `Card`, `WorkflowTabs` already migrated. No other changes needed.

---

## Step 4.8: LandingSection — No change

**File:** `layouts/LandingSection.tsx`

Pure `<section>` wrapper. No HeroUI involvement.

---

## Phase 4 Checklist

- [ ] 4.1 — ProductShootsForm: accordion → Disclosure, raw buttons → Button
- [ ] 4.2 — AdGraphicsPanel: ToggleField onChange update, raw buttons → Button
- [ ] 4.3 — StudioStepperLayout: Frame → Card, PillButton → Button
- [ ] 4.4 — Result frames: Frame → Card (4 files)
- [ ] 4.5 — Landing organisms: Frame → Card (5 files)
- [ ] 4.6 — AppShellLayout: Card + Disclosure mobile nav
- [ ] 4.7 — StudioLayout: transitive update
- [ ] 4.8 — LandingSection: no change (verify)

### End-to-end verification

After Phase 4, the entire app should be running on HeroUI components:

1. **Product Shoots workflow:** Form renders, advanced options expand/collapse, all fields work, generation submits
2. **Ad Graphics workflow:** Tab switching (upload/URL), image dropzone, preview card, form submission
3. **Landing page:** All cards render, CTAs navigate correctly
4. **Navigation:** Mobile menu opens/closes, desktop nav active states work
5. **Accessibility:** Tab through entire form with keyboard, verify focus ring, screen reader test
6. **Chrome:** Squircle corners visible
7. **Firefox:** Standard rounded corners, no visual breakage

**Next:** [Phase 5 — Cleanup](./09-phase-5-cleanup.md)
