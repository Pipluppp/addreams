# Addreams V2 - Final Design Specification

Last updated: 2026-02-12
Status: Final for Frontend Redesign V2

## 1) Direction and Evaluation

This specification intentionally steers toward the clean conversion-first structure seen in UMSO-like marketing pages, while preserving Addreams brand choices and product needs.

What we adopt from the reference aesthetic:
1. Clear section hierarchy and whitespace-first layout.
2. Minimal chrome and high readability.
3. Conversion-focused landing structure.
4. Consistent card/grid rhythm and restrained motion.

What we change for Addreams:
1. Typography system is led by `Google Sans Flex` (not Inter + serif split).
2. Accent typography moments use `Geist Pixel Circle` only in controlled spots.
3. Rounded UI uses squircle geometry via `squircle-js` instead of regular border radius styling alone.
4. Studio experience is step-based and task-driven (not a generic single long form).

## 2) Core Principles

1. Calm, premium surfaces with strong typographic punch.
2. Three accent colors with strict role-based usage rules.
3. Visual consistency between landing and studio.
4. Steps over clutter: progressive disclosure in workflows.
5. Squircle-first rounded components for visual identity.

## 3) Global Tokens

### 3.1 Color Tokens

```css
:root {
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
}
```

Usage rules:
1. Neutrals must dominate the interface visual weight (target 80-90% neutral surfaces and text).
2. `--color-accent-primary` (blue) is the primary interactive color for CTAs, active states, and links.
3. `--color-accent-secondary` (orange) is for secondary emphasis, status callouts, and highlighted support actions.
4. `--color-accent-highlight` (gold) is for highlight surfaces, chips, and feature spotlight backplates.
5. For text contrast: white text is allowed on blue; dark text is required on orange and gold.
6. Do not introduce additional saturated brand colors in component code.

Contrast pair constraints:
1. Avoid blue text on orange backgrounds.
2. Avoid gold text on white backgrounds.
3. Avoid white text on orange and white text on gold for normal-size UI copy.
4. Every page should remain legible and well-grouped in grayscale.

### 3.2 Typography Tokens

```css
:root {
  --font-ui: "Google Sans Flex", "Inter", "Segoe UI", sans-serif;
  --font-accent: "Geist Pixel Circle", "Google Sans Flex", sans-serif;

  --text-hero: clamp(2.3rem, 5.4vw, 4.6rem);
  --text-h1: clamp(1.9rem, 4.1vw, 3rem);
  --text-h2: clamp(1.45rem, 2.8vw, 2.2rem);
  --text-body: 1rem;
  --text-small: 0.875rem;
  --text-micro: 0.75rem;
}
```

Variable font presets for `Google Sans Flex`:
1. Hero preset: high weight, slightly condensed width for punch.
2. Section heading preset: medium-high weight, balanced width.
3. Body preset: regular weight, neutral width, readability first.

Recommended pattern:
```css
.hero-title {
  font-family: var(--font-ui);
  font-variation-settings: "wght" 760, "wdth" 94, "opsz" 72;
}

.section-title {
  font-family: var(--font-ui);
  font-variation-settings: "wght" 650, "wdth" 98, "opsz" 48;
}

.ui-text {
  font-family: var(--font-ui);
  font-variation-settings: "wght" 430, "wdth" 100, "opsz" 14;
}
```

`Geist Pixel Circle` usage rules:
1. Allowed: accent words, step markers, tiny tags, selected metric highlights.
2. Disallowed: body copy, form labels, long CTA text, dense lists.

### 3.3 Spacing Tokens

```css
:root {
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 24px;
  --space-6: 32px;
  --space-7: 48px;
  --space-8: 64px;
  --space-9: 96px;
}
```

Layout defaults:
1. Max content width: 1120px.
2. Section vertical padding: 96px desktop, 64px mobile.
3. Primary card padding: 24px.

## 4) Shape Language: Squircle Standard

Rounded components must use `https://github.com/bring-shrubbery/squircle-js`.

Scope:
1. Buttons and pill controls.
2. Inputs/selects/textareas with rounded shells.
3. Cards, panels, chips, and modal containers.
4. Step badges and CTA containers with rounded geometry.

Implementation rules:
1. Use one shared squircle helper/component abstraction in the design system.
2. Radius and smoothness are token-driven.
3. `border-radius` is a fallback only, never the primary rendering approach for rounded brand surfaces.

Default squircle tokens:
```css
:root {
  --sq-radius-sm: 8;
  --sq-radius-md: 12;
  --sq-radius-lg: 18;
  --sq-radius-xl: 24;

  --sq-smooth-sm: 0.7;
  --sq-smooth-md: 0.78;
  --sq-smooth-lg: 0.84;
}
```

## 5) Layout System

1. Top navigation, announcement strip (optional), hero, feature grid, social proof, CTA.
2. Containerized sections with consistent gutters.
3. Desktop: multi-column grids; mobile: single-column with persistent action affordances.
4. Avoid ornamental asymmetry unless it serves hierarchy.

## 6) Landing Page Specification

### 6.1 Hero
1. Strong value proposition in oversized `Google Sans Flex`.
2. Secondary subcopy focused on measurable outcomes.
3. Two primary entry CTAs:
   - `Start Product Shoots`
   - `Start Ad Graphics`
4. One controlled accent word can use `Geist Pixel Circle`.

### 6.2 Feature Grid
1. Four capability cards in 2x2 (desktop), 1-column (mobile).
2. Each card: title, short body, visual proof/screenshot.
3. Card shells should use squircle geometry.

### 6.3 Proof and Trust
1. Compact social proof row (metrics/logos/testimonials).
2. Testimonial cards can be horizontal scroll on mobile.
3. Keep copy tight and scannable.

### 6.4 Conversion Footer CTA
1. Short commitment copy.
2. Primary CTA uses `--color-accent-primary` with `--color-on-primary`.
3. Secondary CTA uses `--color-accent-secondary` with `--color-on-secondary`.
4. Optional highlight strip/chip can use `--color-accent-highlight` with `--color-on-highlight`.

## 7) Studio UX Specification

The studio must feel guided and production-focused.

Stepper framework (both workflows):
1. Step 1: Brief.
2. Step 2: Inputs.
3. Step 3: Creative Controls.
4. Step 4: Advanced Controls.
5. Step 5: Review and Generate.
6. Step 6: Result and Iterate.

Behavior rules:
1. Next step blocked until current required fields are valid.
2. Back step always available and state-preserving.
3. Focus first invalid field on invalid continuation.
4. Sticky action bar on mobile and desktop.
5. Final review shows payload summary and validation summary.

## 8) Components and States

Required state support for every form-heavy screen:
1. Empty state.
2. Inline validation error state.
3. Loading/in-progress state.
4. Success/result state.
5. Recoverable API error state.

## 9) Motion

1. Duration tiers:
   - micro: 160-220ms
   - medium: 260-360ms
   - section reveals: 420-560ms
2. Animate opacity and transform only.
3. Respect `prefers-reduced-motion` with reduced or disabled non-essential animation.

## 10) Accessibility

1. Semantic controls first (`button`, `a`, `label`, inputs).
2. Visible `focus-visible` styles on all interactive elements.
3. Inline errors tied to fields and announced politely.
4. Keyboard support for step navigation and form submission.

## 11) Performance Rules

1. Route-level code splitting for major pages and studio feature routes.
2. Lazy-load below-fold images.
3. Avoid heavy animation/carousel libraries.
4. Keep step transitions cheap and interruptible.

## 12) Anti-Patterns

Do not ship these patterns in V2:
1. Generic template gradients or noisy background effects.
2. Inconsistent font usage outside the typography rules above.
3. Regular rounded corners where squircle components are required.
4. Dense multi-panel forms without progressive step flow.
5. Unstructured use of blue/orange/gold that competes for attention.
6. Color-only hierarchy that fails grayscale readability.

## 13) Source of Truth

This `docs/design.md` is the visual and UX source of truth for:
1. `docs/plans/frontend-redesign-v2/`
2. Frontend implementation changes under `frontend/src/`

If conflicts appear between plan docs and implementation, resolve in favor of this file and then update plans accordingly.
