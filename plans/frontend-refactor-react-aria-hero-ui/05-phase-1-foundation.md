# Phase 1: Foundation

Install HeroUI v3, configure Tailwind integration, set up CSS corner-shape, and map the design system tokens. This phase is non-breaking — it adds the new system alongside the existing one.

**Prerequisite:** None
**Output:** HeroUI available for use, CSS corner-shape active, design tokens mapped
**Breaking changes:** None

---

## Step 1.1: Install HeroUI v3

```bash
cd frontend
npm install @heroui/styles@beta @heroui/react@beta
```

This installs:
- `@heroui/react` — component library
- `@heroui/styles` — required style/theme layer import
- `react-aria-components` — React Aria primitives (transitive dependency)

### Verify compatibility

After install, verify no peer dependency conflicts:
- React 19 — HeroUI v3 supports React 19
- Tailwind v4 — HeroUI v3 targets Tailwind v4

Run `npm run typecheck` to confirm no type conflicts.

---

## Step 1.2: Import HeroUI Styles in CSS

Add HeroUI styles immediately after Tailwind in `frontend/src/index.css`:

```css
@import "tailwindcss";
@import "@heroui/styles";
```

Import order matters: Tailwind first, HeroUI second.

### Verify

After importing styles, create a test file that imports a HeroUI component and confirm it renders correctly:

```tsx
// Temporary test — delete after verification
import { Button } from "@heroui/react";
<Button variant="primary">Test</Button>
```

Run `npm run dev`, confirm the button renders. Then delete the test.

---

## Step 1.3: Set up CSS corner-shape

Edit `frontend/src/index.css`:

### 1.3a: Add radius tokens (replace squircle JS tokens)

```css
@theme {
  /* ... existing tokens ... */

  /* Replace --sq-radius-* and --sq-smooth-* with standard radius tokens */
  --radius-sm:  12px;
  --radius-md:  18px;
  --radius-lg:  24px;
  --radius-xl:  32px;
  --radius-2xl: 42px;

  /* Remove these (Phase 5 cleanup, but stop using them now):
  --sq-radius-sm: 12;
  --sq-radius-md: 18;
  --sq-radius-lg: 24;
  --sq-radius-xl: 32;
  --sq-smooth-sm: 0.82;
  --sq-smooth-md: 0.88;
  --sq-smooth-lg: 0.94;
  */
}
```

### 1.3b: Add global corner-shape rule

```css
@layer base {
  /* Existing rules ... */

  @supports (corner-shape: squircle) {
    *,
    *::before,
    *::after {
      corner-shape: squircle;
    }
  }
}
```

This single rule means: **any element with `border-radius` set will automatically get squircle corners** in supporting browsers. No per-component work.

### 1.3c: Verify

Open the app in Chrome 139+. Elements with `border-radius` should now show smooth squircle corners. Open in Firefox — should show standard rounded corners (graceful fallback).

---

## Step 1.4: Map design tokens to HeroUI semantic variables

Add HeroUI semantic variable overrides to `index.css` using canonical names from HeroUI docs (`--background`, `--accent`, `--surface`, `--field-*`, etc.).

Add under `@layer base`:

```css
@layer base {
  :root {
    --background: var(--color-canvas);
    --foreground: var(--color-ink);
    --muted: var(--color-ink-muted);

    --surface: var(--color-surface);
    --surface-foreground: var(--color-ink);
    --surface-secondary: var(--color-surface-alt);
    --surface-secondary-foreground: var(--color-ink);
    --surface-tertiary: var(--color-surface-alt);
    --surface-tertiary-foreground: var(--color-ink);

    --accent: var(--color-accent-primary);
    --accent-foreground: var(--color-on-primary);
    --success: var(--color-success);
    --warning: var(--color-warning);
    --danger: var(--color-error);

    --border: var(--color-border);

    --field-background: var(--color-surface);
    --field-foreground: var(--color-ink);
    --field-placeholder: var(--color-ink-muted);
    --field-border: var(--color-border-soft);

    --radius: var(--radius-lg);
    --field-radius: var(--radius-lg);
    --focus: var(--color-accent-primary);
  }
}
```

> **Important:** Do not use custom `--heroui-*` aliases. Stick to HeroUI's documented semantic names.

### Verify

After mapping, HeroUI components should render with your brand colors, not HeroUI defaults. Test with a Button:

```tsx
import { Button } from "@heroui/react";
// Should render with #0064ff blue background, not HeroUI's default blue
<Button variant="primary">Test</Button>
```

---

## Step 1.5: Add BEM class overrides

Add component-level style overrides to `index.css` to match current visual design. See `02-design-system-migration.md` for the full list.

Start with the components you'll migrate first:

```css
@layer components {
  /* Button — matches current PillButton styling */
  .button {
    @apply inline-flex items-center justify-center rounded-2xl px-5 py-2.5
           text-sm font-semibold transition-colors duration-200;
  }
  .button--primary {
    @apply bg-accent-primary text-on-primary hover:bg-accent-primary-hover;
  }
  .button--secondary {
    @apply bg-accent-secondary text-on-secondary hover:bg-accent-secondary-hover;
  }
  .button--ghost {
    @apply bg-surface text-ink hover:bg-surface-alt hover:text-accent-primary;
  }
  .button:disabled, .button[aria-disabled="true"] {
    @apply cursor-not-allowed opacity-50;
  }

  /* Card — matches current Frame styling */
  .card {
    @apply rounded-xl bg-surface
           shadow-[0_1px_0_color-mix(in_srgb,var(--color-ink)_8%,transparent)];
  }

  /* Input/Textarea — matches current TextField styling */
  .input, .textarea {
    @apply w-full rounded-lg bg-surface px-3 py-2.5 text-sm text-ink
           placeholder:text-ink-muted transition-colors duration-200;
  }
  [data-invalid="true"] .input,
  [data-invalid="true"] .textarea {
    background: color-mix(in srgb, var(--color-error) 8%, var(--color-surface));
  }

  /* Label */
  .label {
    @apply text-sm font-medium text-ink-soft;
  }

  /* Description */
  .description {
    @apply text-xs text-ink-muted;
  }

  /* FieldError */
  .field-error {
    @apply text-xs text-error;
  }

  /* Switch — matches current ToggleField styling */
  .switch {
    @apply flex items-start justify-between gap-3 rounded-lg bg-surface px-3 py-2.5 text-sm;
  }
  .switch__control {
    @apply h-6 w-11 rounded-xl bg-surface-alt transition-colors duration-200;
  }
  .switch__control[data-selected="true"] {
    @apply bg-accent-primary;
  }
  .switch__thumb {
    @apply h-5 w-5 rounded-xl bg-surface transition-transform duration-200;
  }

  /* Select trigger — matches current SelectField styling */
  .select__trigger {
    @apply w-full rounded-lg bg-surface px-3 py-2.5 text-sm text-ink transition-colors duration-200;
  }
  [data-invalid="true"] .select__trigger {
    background: color-mix(in srgb, var(--color-error) 8%, var(--color-surface));
  }
  .select__popover {
    @apply rounded-xl bg-surface shadow-lg;
  }

  /* Chip — matches current MetadataChip styling */
  .chip {
    @apply inline-flex items-center gap-2 rounded-xl bg-surface px-3 py-1.5 text-xs text-ink;
  }

  /* Tabs — matches current WorkflowTabs styling */
  .tabs__tab {
    @apply rounded-xl px-4 py-2 text-sm font-medium transition-colors duration-200;
  }
  .tabs__tab[aria-selected="true"] {
    @apply bg-accent-primary text-on-primary;
  }
  .tabs__tab:not([aria-selected="true"]) {
    @apply bg-surface text-ink-soft hover:bg-surface-alt hover:text-accent-primary;
  }

  /* Focus ring for React Aria components */
  [data-focus-visible="true"] {
    @apply outline-none ring-2 ring-accent-primary ring-offset-2 ring-offset-canvas;
  }
}
```

---

## Step 1.6: Verify end-to-end

After all foundation work:

1. `npm run dev` — app loads without errors
2. Existing components still work (nothing changed yet)
3. CSS corner-shape is active in Chrome (check any existing `border-radius` element)
4. A test HeroUI `<Button>` renders with correct brand colors
5. `npm run build` — builds without errors
6. `npm run typecheck` — passes

---

## Deliverables

- [x] `@heroui/react` and `@heroui/styles` installed
- [x] `@import "@heroui/styles"` added after Tailwind import in `index.css`
- [x] `--radius-*` tokens added to `@theme`
- [x] Global `corner-shape: squircle` rule added under `@supports`
- [x] HeroUI CSS variables mapped to addreams tokens
- [x] BEM class overrides added in `@layer components`
- [x] `[data-focus-visible]` focus ring rule added
- [x] Build and typecheck pass
- [x] Visual verification in Chrome and Firefox

**Next:** [Phase 2 — Atom Migrations](./06-phase-2-atoms.md)
