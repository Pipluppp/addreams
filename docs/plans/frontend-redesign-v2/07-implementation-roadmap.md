# 07 - Implementation Roadmap

Last updated: 2026-02-12
Status: Finalized (aligned to docs/design.md)

## Objective
Define a clean, phased rollout for implementing Frontend Redesign V2.

## Design Linkage
1. This roadmap executes the specification in `docs/design.md`.
2. Each phase must be validated against the matching design sections before moving forward.

## Phase 1 - Aesthetic Lock
1. Finalize typography presets for `Google Sans Flex` and `Geist Pixel Circle`.
2. Finalize tri-accent palette roles (`#0064FF`, `#EC520B`, `#FFCB00`) and token naming.
3. Finalize stepper behavior and interaction patterns.
4. Lock contrast-safe pair matrix and grayscale review checklist.

## Phase 2 - Foundation Rebuild
1. Implement tokenized design system updates.
2. Integrate `squircle-js` and build a shared squircle utility/wrapper for rounded components.
3. Build shared V2 primitives and studio stepper shell.
4. Wire shared state patterns and navigation model.

## Phase 3 - Product Shoots V2
1. Implement step flow screens and validation gates.
2. Integrate mutation submit and result state.
3. Verify Qwen-ready payload parity.

## Phase 4 - Ad Graphics V2
1. Implement image-source step and preview state.
2. Implement controls, advanced, review, and result steps.
3. Verify file validation and payload generation behavior.

## Phase 5 - Landing V2
1. Implement hero, proof, workflow cards, and CTA sections.
2. Align typography and brand tone with studio pages.
3. Validate conversion paths into both workflows.

## Phase 6 - QA and Release
1. Run `npm run lint`.
2. Run `npm run format:check`.
3. Run `npm run typecheck`.
4. Run `npm run build`.
5. Run `npm run cf:check -w frontend`.
6. Verify rounded surfaces consistently use squircle rendering.
7. Verify tri-accent usage follows token roles and contrast rules.
8. Run responsive + accessibility verification pass.
