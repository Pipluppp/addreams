# 02 - Design System and Tokens

Last updated: 2026-02-12
Status: Finalized (aligned to docs/design.md)

## Objective
Rebuild the design system to be token-first, consistent, and scalable.

## Design Linkage
1. Aligns with `docs/design.md` sections 3, 4, and 8.
2. `squircle-js` usage is mandatory per `docs/design.md` section 4.

## Squircle Standard
1. Library: `https://github.com/bring-shrubbery/squircle-js`.
2. Rounded components must render with squircle geometry:
   - buttons
   - pills/chips/badges
   - cards/panels
   - inputs/selects/textarea shells
   - modal/sheet containers
3. Standard CSS `border-radius` can be used only as a non-enhanced fallback.
4. Expose squircle controls via tokens/utilities (corner smoothing + radius scale), not ad hoc per component.
5. Keep a shared wrapper/helper for squircle rendering so usage stays consistent and maintainable.

## Token Model
1. Color tokens:
   - neutral canvas/surface
   - text hierarchy
   - tri-accent roles (primary, secondary, highlight)
   - on-accent contrast tokens for text
   - semantic success/warning/error
2. Typography tokens:
   - display, heading, body, caption tiers
   - font family mapping and weight presets
3. Spacing tokens:
   - consistent 4/8px rhythm base
   - section spacing presets
4. Radius and border tokens:
   - fixed radii by component category
   - border and outline hierarchy
5. Motion tokens:
   - standard duration/easing tiers
   - reduced-motion safe variants

## Implementation Starter Token Block
Use this as the baseline in `frontend/src/index.css` under Tailwind v4 `@theme`, then refine as implementation details are finalized.

```css
@import "tailwindcss";

@theme {
  --color-canvas: #fcfbfa;
  --color-surface: #ffffff;
  --color-surface-alt: #f6f4f2;

  --color-ink: #171717;
  --color-ink-soft: #4b4b4b;
  --color-ink-muted: #787878;

  --color-border: #dad6d1;
  --color-border-soft: #ece8e3;

  --color-brand-blue: #0064ff;
  --color-brand-blue-hover: #0057df;
  --color-brand-orange: #ec520b;
  --color-brand-orange-hover: #d24809;
  --color-brand-gold: #ffcb00;
  --color-brand-gold-soft: #fff3bf;

  --color-accent-primary: var(--color-brand-blue);
  --color-accent-primary-hover: var(--color-brand-blue-hover);
  --color-accent-secondary: var(--color-brand-orange);
  --color-accent-secondary-hover: var(--color-brand-orange-hover);
  --color-accent-highlight: var(--color-brand-gold);
  --color-accent-highlight-soft: var(--color-brand-gold-soft);

  --color-on-primary: #ffffff;
  --color-on-secondary: #171717;
  --color-on-highlight: #171717;

  --color-success: #1f9f62;
  --color-warning: #dd9a2b;
  --color-error: #d64545;

  --font-ui: "Google Sans Flex", "Inter", "Segoe UI", sans-serif;
  --font-accent: "Geist Pixel Circle", "Google Sans Flex", sans-serif;

  --text-hero: clamp(2.3rem, 5.4vw, 4.6rem);
  --text-h1: clamp(1.9rem, 4.1vw, 3rem);
  --text-h2: clamp(1.45rem, 2.8vw, 2.2rem);
  --text-body: 1rem;
  --text-small: 0.875rem;
  --text-micro: 0.75rem;

  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 24px;
  --space-6: 32px;
  --space-7: 48px;
  --space-8: 64px;
  --space-9: 96px;

  --sq-radius-sm: 8;
  --sq-radius-md: 12;
  --sq-radius-lg: 18;
  --sq-radius-xl: 24;

  --sq-smooth-sm: 0.7;
  --sq-smooth-md: 0.78;
  --sq-smooth-lg: 0.84;
}
```

Contrast notes:
1. White text is allowed on blue.
2. Use dark text on orange and gold.
3. Do not use blue-on-orange or gold-on-white for core UI copy.

## Component Library V2
1. Atoms:
   - `Button`
   - `Input`
   - `Textarea`
   - `Select`
   - `Toggle`
   - `Badge`
2. Molecules:
   - `StepHeader`
   - `FieldGroup`
   - `ProgressStepper`
   - `ValidationSummary`
3. Organisms:
   - `StudioStepperLayout`
   - `WorkflowReviewPanel`
   - `ResultPanel`
4. Layouts:
   - `MarketingLayout`
   - `StudioLayoutV2`

## Rules
1. No hardcoded colors in component files.
2. No one-off spacing values when token equivalents exist.
3. Variant APIs should stay minimal and predictable.
4. Visual state changes should use explicit transitions, never `transition: all`.
5. Any rounded component variant must use the shared squircle abstraction.
6. Blue, orange, and gold must follow role-based usage and contrast-safe pairing rules.
7. UI structure must remain understandable in grayscale.
