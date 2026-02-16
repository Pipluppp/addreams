# Step 05: Security Hardening Plan Sketch

## Goal

Reduce abuse risk on production Cloudflare Workers (free plan), add observability, and enforce safe-by-default auth/API behavior.

## Current Gap

- Core auth is working, but hardening is partial.
- Need explicit anti-abuse controls for auth and generation endpoints.
- Generation endpoints are still too accessible before full gating is enforced.

## Threat Priorities

- Credential stuffing and brute-force on sign-in.
- Abuse of expensive generation endpoints.
- Cross-origin misuse and cookie/session misuse.
- Lack of actionable logs for incident response.

## Hardening Sketch

### Immediate Policy Lock-ins

- No authenticated session, no generation access.
- Protect all generation endpoints with auth middleware (`401 Unauthorized` if missing session).
- Frontend generation pages must hard-gate:
- unauthenticated users are redirected to `/login?redirect=...`
- generate actions are disabled until session is loaded and valid
- Keep existing CORS + trusted origins restrictions and enforce credentials-based session checks.

### App-Level Controls

- Add per-user and per-IP rate limits on auth endpoints and workflow endpoints.
- Add stricter payload limits and validation fail-fast.
- Normalize security error responses to avoid leaking internals.

### Cloudflare Controls

- Tighten CORS to trusted origins only.
- Configure Cloudflare WAF rules for known abuse patterns.
- Add basic bot protection challenge for suspicious traffic.
- Restrict methods and paths at edge where practical.

### Auth and Session

- Keep Better Auth session cookies as primary auth mechanism.
- Set secure cookie flags and trusted origins correctly for prod.
- Rotate `BETTER_AUTH_SECRET` only with planned session invalidation.
- JWT is optional; do not add custom JWT unless there is a concrete cross-service requirement.

### Logging and Monitoring

- Add structured logs with request IDs.
- Log auth failures, rate-limit hits, and workflow denials.
- Define minimal security dashboard queries (signin failures, 4xx spikes, out-of-credits abuse attempts).

## Acceptance Criteria

- Brute-force attempts are throttled and visible in logs.
- Workflow abuse from a single actor is bounded.
- CORS and trusted origin checks prevent cross-origin session abuse.
- Incident triage can identify actor, endpoint, and time window.
- Unauthenticated calls to generation endpoints are denied consistently.
- Generation UI is inaccessible/disabled unless signed in.

## Open Decisions

- Rate limiter storage: Durable Object vs KV-backed strategy.
- Exact per-route rate thresholds for free-plan cost control.
