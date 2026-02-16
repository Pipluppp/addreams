# Step 01: Auth Gating Plan Sketch

## Goal

Block all generation access for signed-out users before any other feature rollout.

## Scope

- Backend: require authenticated session for every generation endpoint.
- Frontend: redirect signed-out users to `/login?redirect=...` before generating.
- Session/CORS: keep trusted origins + credentialed requests enforced.

## Analysis Inputs Accounted For

- From `2026-02-16-account-auth/analysis.md`: generation endpoints must not remain anonymously reachable while auth cookies are enabled cross-origin.
- This step is the hard lock that ensures no unauthenticated request reaches Qwen provider calls.
- Frontend transport must send credentials when calling backend from non-same-origin setups (for example direct `addreams-api.*` calls in workers.dev environments).

## Required Behavior

- `401 Unauthorized` for generation calls without valid session.
- Generation UI actions disabled while session is loading or missing.
- No anonymous path should reach Qwen provider calls.

## Implementation Notes

- Backend:
- Attach auth middleware to workflow routes before provider invocation.
- Keep unauthorized response normalized and stable (`401` + typed code/message).
- Ensure `/api/workflows/*` and future generation/history write paths share the same session guard.
- Frontend:
- Route-level guard for generation pages and action-level guard on Generate buttons.
- Disable submit while session is loading or absent.
- Preserve redirect target (`/login?redirect=...`) and resume after sign-in.
- Ensure workflow requests include session cookies where cross-origin applies.

## Acceptance Criteria

- Signed-out calls to generation endpoints are always denied.
- Signed-out users cannot trigger generation from UI.
- Signed-in users continue to generate normally (credit checks handled in next step).
- Manual/API verification: unauthenticated POST to each workflow endpoint returns `401`, and no provider call is made.
