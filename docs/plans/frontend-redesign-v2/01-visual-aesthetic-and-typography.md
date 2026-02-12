# 01 - Visual Aesthetic and Typography

Last updated: 2026-02-12
Status: Finalized (aligned to docs/design.md)

## Objective
Define a clear visual language with typography as the primary brand differentiator.

## Design Linkage
1. Aligns with `docs/design.md` sections 1, 2, and 3.
2. Typography implementation must follow the font and usage rules in `docs/design.md`.

## Aesthetic Direction
1. Style: modern performance-creative product with clean surfaces and bold typography.
2. Feel: high trust, sharp, and intentional.
3. Visual rhythm: large headline moments, quieter UI controls, generous spacing.
4. Shape language: use squircle-based rounded geometry consistently across rounded surfaces.
5. Noise reduction: remove mixed motifs and inconsistent framing patterns.

## Color Strategy
1. Primary interactive accent: `#0064FF` (blue).
2. Secondary emphasis accent: `#EC520B` (orange).
3. Highlight accent: `#FFCB00` (gold).
4. Neutral canvas and text should dominate; accents are for hierarchy, not decoration.
5. Color usage must pass grayscale readability checks.

## Typography Strategy
1. Primary font: `Google Sans Flex`.
2. Accent font: `Geist Pixel Circle`.

## Usage Rules
1. `Google Sans Flex` is used for all body text, controls, navigation, and most headings.
2. `Geist Pixel Circle` is used sparingly for visual punch moments only:
   - step number markers
   - tiny accent labels
   - selective hero emphasis words
3. Never use `Geist Pixel Circle` for dense text, form labels, or paragraph content.
4. Use a bounded type scale with consistent line-height and tracking settings.

## Hero Typography System
1. Oversized value-prop headline with `Google Sans Flex` variable settings.
2. One accent word or short phrase can use `Geist Pixel Circle`.
3. Supporting subtext remains highly legible and lower contrast than headline.

## Studio Typography System
1. Step titles are strong and readable at a glance.
2. Form labels and helper text prioritize clarity over style.
3. Validation messages use compact, high-contrast microcopy.
