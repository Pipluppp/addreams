# Step 04: Auth UX and Profile Implementation Update

## Status

Implemented on February 17, 2026.

## Goal

Improve `/login` and `/profile` UX while keeping current email/password auth flow stable.

## Implemented Changes

### Routing and Layout

- `/login` now renders in a dedicated auth layout and is no longer nested under `AppShellLayout`.
- Auth page has a separate shell (brand + home link), with no app sidebar/footer chrome.

### Login and Sign-Up UX

- Kept a single `/login` route with tabs (`Sign In`, `Create Account`).
- Rebuilt auth page into a full-page experience with responsive split treatment:
- desktop: form pane + branded visual pane
- smaller widths: compact integrated visual treatment remains visible
- Removed all user-facing environment diagnostics from auth UI.
- Removed auth-page operational alerts not needed for users:
- redirect-target notice
- email verification warning callout
- Removed extra descriptive copy per latest UX pass.
- Preserved auth behavior:
- redirect sanitization remains in place
- sign-in success returns to redirect target (or `/`)
- sign-up success now also returns to redirect target (or `/`)
- Kept sign-up `name` as required.

### Profile Simplification

- Removed display-name editing UI and setup-mode branch from `/profile`.
- Profile now focuses on account overview, credits, and session sign-out controls.

### Navbar Identity

- Logged-in navbar trigger now shows full user name.
- Fallback order:
- `user.name`
- email local-part
- full email
- Long names are truncated to protect header layout.

### Styling and Design-System Updates

- Added layered low-alpha shadow utilities for smoother elevation.
- Updated auth tabs contrast and rounded treatment.
- Applied requested nav chip color adjustments (for example history chip).
- Per iterative feedback, refined capabilities section visuals on home:
- flatter structure with less nested framing
- tokenized color treatment for product/ad panels
- rounded media consistency and image-fit fixes

## Environment Guidance Policy

- Runtime base URL guidance is docs-only and intentionally removed from user-facing auth screens.
- Checklist now lives in `docs/deployment-quickstart.md`.

## Verification

- `npm run typecheck -w frontend` passes.
- `npm run build -w frontend` passes (bundle-size warning remains informational).
