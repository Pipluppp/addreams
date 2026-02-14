# Design System Migration

How to map the current addreams design tokens, squircle corners, typography, and component styling to HeroUI v3's theming system — while retaining the exact current look and feel.

## Current Design Tokens

Source: `frontend/src/index.css` — defined via Tailwind v4's `@theme` directive.

### Colors

```css
/* Surfaces */
--color-canvas:       #f9f5f0    /* warm off-white page background */
--color-surface:      #ffffff    /* card/component background */
--color-surface-alt:  #f5f1ea    /* secondary surface, muted areas */

/* Ink (text) */
--color-ink:          #171717    /* primary text */
--color-ink-soft:     #4b4b4b    /* secondary text (labels) */
--color-ink-muted:    #787878    /* tertiary text (helpers, placeholders) */

/* Borders */
--color-border:       #dad6d1
--color-border-soft:  #ece8e3

/* Brand */
--color-brand-blue:         #0064ff
--color-brand-blue-hover:   #0057df
--color-brand-orange:       #ec520b
--color-brand-orange-hover: #d24809
--color-brand-gold:         #ffcb00
--color-brand-gold-soft:    #fff3bf

/* Semantic Accents */
--color-accent-primary:       var(--color-brand-blue)
--color-accent-primary-hover: var(--color-brand-blue-hover)
--color-accent-secondary:       var(--color-brand-orange)
--color-accent-secondary-hover: var(--color-brand-orange-hover)
--color-accent-highlight:       var(--color-brand-gold)
--color-accent-highlight-soft:  var(--color-brand-gold-soft)

/* On-color text */
--color-on-primary:   #ffffff
--color-on-secondary: #171717
--color-on-highlight: #171717

/* Status */
--color-success: #2d9f6f
--color-warning: #dd9a2b
--color-error:   #d64545
```

### Typography

```css
--font-ui:     "Google Sans Flex", "Inter", "Segoe UI", sans-serif
--font-accent: "Geist Pixel Circle", "Google Sans Flex", sans-serif

/* Sizes */
--text-hero:  clamp(2.3rem, 5.4vw, 4.6rem)
--text-h1:    clamp(1.9rem, 4.1vw, 3rem)
--text-h2:    clamp(1.45rem, 2.8vw, 2.2rem)
--text-body:  1rem
--text-small: 0.875rem
--text-micro: 0.75rem

/* Utility classes */
.hero-title    → wght:760, wdth:94, opsz:72, leading:0.96, tracking:-0.02em
.section-title → wght:650, wdth:98, opsz:48, leading:1.02, tracking:-0.015em
.ui-title      → wght:620, wdth:98, opsz:32, leading:1.1
.accent-type   → font-accent, wght:500, tracking:0.015em
```

### Spacing

```css
--space-1: 4px   --space-4: 16px  --space-7: 48px
--space-2: 8px   --space-5: 24px  --space-8: 64px
--space-3: 12px  --space-6: 32px  --space-9: 96px
```

### Squircle Radii (current → CSS replacement)

| Token | Current (JS pixels) | CSS Replacement |
|-------|-------------------|-----------------|
| `--sq-radius-sm` | 12px | `border-radius: 12px` |
| `--sq-radius-md` | 18px | `border-radius: 18px` |
| `--sq-radius-lg` | 24px | `border-radius: 24px` |
| `--sq-radius-xl` | 32px | `border-radius: 32px` |
| `--sq-radius-xxl` | 42px | `border-radius: 42px` |

All get `corner-shape: squircle` via `@supports`.

---

## CSS Corner-Shape Setup

### Step 1: Define radius utility classes

Add to `index.css` under `@theme`:

```css
@theme {
  /* Replace JS squircle presets with CSS tokens */
  --radius-sm:  12px;
  --radius-md:  18px;
  --radius-lg:  24px;
  --radius-xl:  32px;
  --radius-2xl: 42px;
}
```

### Step 2: Global corner-shape with progressive enhancement

Add to `@layer base`:

```css
@layer base {
  @supports (corner-shape: squircle) {
    *,
    *::before,
    *::after {
      corner-shape: squircle;
    }
  }
}
```

This single rule applies squircle corners **everywhere** `border-radius` is set. No per-component work needed.

### Step 3: Remove squircle.ts and SquircleSurface

- Delete `lib/squircle.ts`
- Delete `atoms/SquircleSurface.tsx`
- Every component that wrapped content in `<SquircleSurface>` now just applies `rounded-{size}` Tailwind class directly

### What users see

| Browser | Experience |
|---------|-----------|
| Chrome 139+, Edge 139+, Opera 123+ | Full squircle corners (identical to current `@squircle-js` output) |
| Firefox, Safari | Standard `border-radius` rounded corners (subtle visual difference, smooth fallback) |

---

## HeroUI Theming

HeroUI v3 uses semantic CSS variables (e.g. `--background`, `--accent`, `--surface`, `--field-*`). We map our tokens to those canonical variables.

### Color Mapping

Add to `index.css` under `@layer base` or `:root`:

```css
@layer base {
  :root {
    /* Core semantic colors */
    --background: var(--color-canvas);
    --foreground: var(--color-ink);
    --muted: var(--color-ink-muted);

    /* Surface hierarchy */
    --surface: var(--color-surface);
    --surface-foreground: var(--color-ink);
    --surface-secondary: var(--color-surface-alt);
    --surface-secondary-foreground: var(--color-ink);
    --surface-tertiary: var(--color-surface-alt);
    --surface-tertiary-foreground: var(--color-ink);

    /* Accent + status */
    --accent: var(--color-accent-primary);
    --accent-foreground: var(--color-on-primary);
    --success: var(--color-success);
    --warning: var(--color-warning);
    --danger: var(--color-error);

    /* Borders and field tokens */
    --border: var(--color-border);
    --field-background: var(--color-surface);
    --field-foreground: var(--color-ink);
    --field-placeholder: var(--color-ink-muted);
    --field-border: var(--color-border-soft);

    /* Radius and focus */
    --radius: var(--radius-lg);
    --field-radius: var(--radius-lg);
    --focus: var(--color-accent-primary);
  }
}
```

> **Note:** Use HeroUI's documented semantic variable names from `theming.mdx` and `colors.mdx`. Avoid custom `--heroui-*` aliases.

### Typography Preservation

HeroUI doesn't enforce its own font. Our `body` rule already sets `font-family: var(--font-ui)` and `font-variation-settings`. These continue to work. No changes needed.

For HeroUI components that render text (labels, descriptions, errors), override their BEM classes:

```css
@layer components {
  .label {
    font-family: var(--font-ui);
    @apply text-sm font-medium text-ink-soft;
  }

  .description {
    @apply text-xs text-ink-muted;
  }

  .field-error {
    @apply text-xs text-error;
  }
}
```

---

## BEM Class Overrides

HeroUI v3 exposes BEM classes on every component. We override these in `@layer components` to match our current styling.

### Button

Current PillButton styling: `inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold`, with tone-based backgrounds.

```css
@layer components {
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

  .button:disabled,
  .button[aria-disabled="true"] {
    @apply cursor-not-allowed opacity-50;
  }

  .button[data-pending="true"] {
    @apply cursor-wait;
  }
}
```

### Input / TextArea

Current styling: `w-full bg-surface px-3 py-2.5 text-sm text-ink placeholder:text-ink-muted`, with error tint.

```css
@layer components {
  .text-field {
    @apply flex flex-col gap-2 text-sm text-ink;
  }

  .input,
  .textarea {
    @apply w-full rounded-lg bg-surface px-3 py-2.5 text-sm text-ink
           placeholder:text-ink-muted transition-colors duration-200;
  }

  .input[data-invalid="true"],
  .textarea[data-invalid="true"],
  [data-invalid="true"] .input,
  [data-invalid="true"] .textarea {
    background: color-mix(in srgb, var(--color-error) 8%, var(--color-surface));
  }
}
```

### Switch

Current ToggleField: custom checkbox with animated dot, `h-6 w-11` track, `h-5 w-5` thumb.

```css
@layer components {
  .switch {
    @apply flex items-start justify-between gap-3 rounded-lg bg-surface
           px-3 py-2.5 text-sm;
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
}
```

### Select

Current: native `<select>` styled like TextField input. HeroUI Select uses a custom dropdown popover.

```css
@layer components {
  .select__trigger {
    @apply w-full rounded-lg bg-surface px-3 py-2.5 text-sm text-ink
           transition-colors duration-200;
  }

  .select__trigger[data-invalid="true"] {
    background: color-mix(in srgb, var(--color-error) 8%, var(--color-surface));
  }

  .select__popover {
    @apply rounded-xl bg-surface shadow-lg;
  }
}
```

### Card / Surface

Current Frame: `bg-surface shadow-[0_1px_0_color-mix(in_srgb,var(--color-ink)_8%,transparent)]`.

```css
@layer components {
  .card {
    @apply rounded-xl bg-surface
           shadow-[0_1px_0_color-mix(in_srgb,var(--color-ink)_8%,transparent)];
  }
}
```

### Chip

Current MetadataChip: `inline-flex items-center gap-2 bg-surface px-3 py-1.5 text-xs text-ink`.

```css
@layer components {
  .chip {
    @apply inline-flex items-center gap-2 rounded-xl bg-surface
           px-3 py-1.5 text-xs text-ink;
  }
}
```

### Tabs

Current WorkflowTabs: `px-4 py-2 text-sm font-medium`, active = `bg-accent-primary text-on-primary`.

```css
@layer components {
  .tabs__tab {
    @apply rounded-xl px-4 py-2 text-sm font-medium transition-colors duration-200;
  }

  .tabs__tab[aria-selected="true"] {
    @apply bg-accent-primary text-on-primary;
  }

  .tabs__tab:not([aria-selected="true"]) {
    @apply bg-surface text-ink-soft hover:bg-surface-alt hover:text-accent-primary;
  }
}
```

---

## Focus Ring Preservation

Current global `:focus-visible` rule:

```css
:focus-visible {
  @apply outline-none ring-2 ring-accent-primary ring-offset-2 ring-offset-canvas;
}
```

HeroUI/React Aria components use `[data-focus-visible]` for styling. Add:

```css
@layer base {
  [data-focus-visible="true"] {
    @apply outline-none ring-2 ring-accent-primary ring-offset-2 ring-offset-canvas;
  }
}
```

---

## Animation Preservation

Current animations (`fade-up` micro/medium/section-reveal) and `prefers-reduced-motion` handling are defined in `index.css` and are independent of component library. No changes needed.

---

## Summary: What Changes in `index.css`

1. **Add** `--radius-*` tokens under `@theme` (replacing `--sq-radius-*` and `--sq-smooth-*`)
2. **Add** global `corner-shape: squircle` under `@supports` in `@layer base`
3. **Add** HeroUI CSS variable mapping under `:root` in `@layer base`
4. **Add** BEM class overrides in `@layer components`
5. **Add** `[data-focus-visible]` rule in `@layer base`
6. **Remove** `--sq-radius-*` and `--sq-smooth-*` tokens
7. **Keep** all color, typography, spacing, animation tokens unchanged
