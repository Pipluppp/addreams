# Step 01: Auth Gating Plan Sketch

## Goal

Block all generation access for signed-out users before any other feature rollout.

## Scope

- Backend: require authenticated session for every generation endpoint.
- Frontend: redirect signed-out users to `/login?redirect=...` before generating.
- Session/CORS: keep trusted origins + credentialed requests enforced.

## Required Behavior

- `401 Unauthorized` for generation calls without valid session.
- Generation UI actions disabled while session is loading or missing.
- No anonymous path should reach Qwen provider calls.

## Acceptance Criteria

- Signed-out calls to generation endpoints are always denied.
- Signed-out users cannot trigger generation from UI.
- Signed-in users continue to generate normally (credit checks handled in next step).
