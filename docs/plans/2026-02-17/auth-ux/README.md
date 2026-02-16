# Step 04: Auth UX and Profile Plan Sketch

## Goal

Improve `/login`, sign-up clarity, and `/profile` usability while keeping current email/password auth flow stable.

## Current Gap

- Login and create-account work, but UX can be clearer and more robust.
- Profile page is functional but minimal.

## Scope

- Frontend: auth screens, profile polish, better states/errors, loading and feedback mechanics (sign up confirm is just some change on the navbar, no oading, etc.)
- Backend: minor API support only where needed.

## Analysis Inputs Accounted For

- From `2026-02-16-account-auth/analysis.md`:
- workers.dev URL inference is useful but brittle; custom-domain deployments must rely on explicit `VITE_AUTH_BASE_URL` and `VITE_API_BASE_URL`.
- `requireEmailVerification: false` is an intentional tradeoff; UX must avoid implying verified-email guarantees that are not yet true.
- Generation actions must be clearly blocked when session is missing or loading.

## Login and Sign-Up Sketch

- Keep a single page with tabs for sign-in and create-account.
- Add stronger validation messaging:
- email format
- minimum password length
- password confirmation for sign-up
- Add clear error mapping for common cases:
- invalid credentials
- account already exists
- temporary backend failure
- Make error copy explicit when auth fails due to missing/expired session cookies.

## Profile Sketch

- Improve profile layout and sectioning.
- Add editable fields roadmap (name now, avatar later).
- Show account type and current credits as first-class summary cards.
- Keep explicit sign-out and session state feedback.

## Route and Session UX

- Preserve redirect behavior (`/login?redirect=...`).
- Show loading skeletons/spinners for session checks.
- Avoid flicker on protected routes.
- Generation workflows are treated as protected actions:
- signed-out users are redirected to login before generating
- signed-in users with zero credits see clear blocked state and next-step message
- Ensure generation fetches and auth fetches use the correct base URLs per environment configuration.
- Add a lightweight environment checklist for local Vite, local worker, workers.dev, and custom-domain deployments.

## Acceptance Criteria

- New user can sign up, land on setup flow, save profile, continue.
- Returning user sign-in is one step and stable.
- Validation and error states are user-readable and actionable.
- Protected routes reliably redirect when unauthenticated.
- Generation attempts never proceed when unauthenticated.
- Auth works without URL surprises across both workers.dev and custom-domain environments when vars are correctly configured.

## Open Decisions

- Whether to split `/login` and `/sign-up` later.
- Whether to add password strength meter now or defer.
