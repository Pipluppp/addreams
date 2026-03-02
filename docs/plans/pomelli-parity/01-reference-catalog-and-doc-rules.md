# 01 - Reference Catalog and Documentation Rules

Last updated: 2026-03-02
Status: Mandatory conventions for parity work

## Objective
Define how Pomelli references are used in implementation docs, tickets, and PRs so intent remains unambiguous.

## Primary Rule
Use `descriptors first`, `images as evidence`.

Meaning:
1. Every planned state/behavior must have text descriptors.
2. Screenshots must be linked as references, not the only description.

## Screenshot ID Catalog

| ID | File | Primary state |
| --- | --- | --- |
| PM-01 | `../../../pomelli/image.png` | Photoshoot entry split |
| PM-02 | `../../../pomelli/image-1.png` | Guided compose (product + templates) |
| PM-03 | `../../../pomelli/image-2.png` | Guided compose focused template panel |
| PM-04 | `../../../pomelli/image-3.png` | Template picker with partial selection |
| PM-05 | `../../../pomelli/image-4.png` | Template picker at max selection |
| PM-06 | `../../../pomelli/image-5.png` | Aspect ratio dropdown state |
| PM-07 | `../../../pomelli/image-6.png` | Guided generation result gallery |
| PM-08 | `../../../pomelli/image-7.png` | Result tile selected with contextual actions |
| PM-09 | `../../../pomelli/image-8.png` | Single-image editor idle |
| PM-10 | `../../../pomelli/image-9.png` | Single-image editor generating |
| PM-11 | `../../../pomelli/image-10.png` | Single-image editor completed |
| PM-12 | `../../../pomelli/image-11.png` | Campaigns home composer + recents |
| PM-13 | `../../../pomelli/image-12.png` | Photoshoot entry (right path emphasized) |
| PM-14 | `../../../pomelli/image-13.png` | Freeform compose (prompt + refs) |
| PM-15 | `../../../pomelli/image-14.png` | Freeform results with prompt recap |
| PM-16 | `../../../pomelli/image-15.png` | Single-image editor alternate example |

## How to Reference in Specs and PRs
1. Cite state ID(s): `PS-GUIDED-COMPOSE (PM-02, PM-03, PM-06)`.
2. Include behavior descriptor:
   - "Aspect ratio selector is inline and contextual, not hidden in advanced settings."
3. Include acceptance check:
   - "When ratio changes, next generation uses selected ratio and label updates."

## Image Usage Policy
1. In implementation docs:
   - link image file paths by ID
   - do not inline all screenshots by default
2. In design review docs:
   - inline up to 2 targeted screenshots if needed to resolve ambiguity
3. In code comments:
   - do not embed images; use state IDs only.

Rationale:
1. Linked references keep docs lightweight and diff-friendly.
2. Descriptor-first docs reduce misinterpretation and speed implementation.

## Required Descriptor Template per State
For each planned state, include:
1. `Purpose`
2. `Visible UI`
3. `User actions`
4. `System reactions`
5. `Exit transitions`
6. `Error/disabled behavior`
7. `Reference IDs`

## Traceability Rules
1. Each implementation PR must map changed behaviors to one or more state IDs.
2. QA checklists must include state IDs to verify parity.
3. If behavior intentionally diverges from Pomelli reference, document:
   - reason
   - expected UX outcome
   - impacted state IDs

