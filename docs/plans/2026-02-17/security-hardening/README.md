# Step 05: Security Hardening Plan Sketch

## Goal

Reduce abuse risk on production Cloudflare Workers (free plan), add observability, and enforce safe-by-default auth/API behavior.

## Current Gap

- Core auth is working, but hardening is partial.
- Need explicit anti-abuse controls for auth and generation endpoints.
- Generation endpoints are still too accessible before full gating is enforced.

## Analysis Issues This Step Owns

From `docs/plans/2026-02-16-account-auth/analysis.md`:

- `C1`: Explicit Better Auth rate-limit and IP-header trust hardening.
- `H1`: Correct `BETTER_AUTH_URL` / `baseURL` semantics (auth server origin, not frontend origin).
- `H2`: Password hash forward-compatibility strategy (versioned format and migration path).
- `H3`: CPU-limit hotspot guardrails for Workers Free (`1102`, latency, burst behavior).
- `M2`: Validate `cookieCache` revocation/update consistency.
- `L2`: Keep CORS allowlist and Better Auth trusted origins synchronized.

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
- Configure Better Auth IP header extraction explicitly for Cloudflare production traffic.
- Set Better Auth rate-limit behavior explicitly (enabled state + storage strategy), not by defaults.

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
- Set `BETTER_AUTH_URL` to backend auth-server origin (`/api/auth/*` host), while frontend origins stay in trusted origins.
- Keep a single source of truth for trusted origins used by both CORS and Better Auth config.
- Define hash format lifecycle:
- current `v1`: `saltHex:keyHex`
- next format introduces explicit version prefix
- rehash-on-login plan for future parameter/KDF upgrades
- Add revocation semantics tests for `session.cookieCache` max-age behavior.

### Logging and Monitoring

- Add structured logs with request IDs.
- Log auth failures, rate-limit hits, and workflow denials.
- Define minimal security dashboard queries (signin failures, 4xx spikes, out-of-credits abuse attempts).
- Track and alert on `1102` rate and auth endpoint P95/P99 latency.
- Add load-test regression checks for sign-up/sign-in before auth/hashing config changes are released.

## Verification Checklist (Hardening Completion)

- Confirm brute-force path:
- `advanced.ipAddress.ipAddressHeaders` is explicitly configured for Cloudflare production headers.
- Better Auth `rateLimit` is explicitly configured and validated in production mode.
- Confirm base URL posture:
- `BETTER_AUTH_URL` points to backend auth origin.
- Frontend/browser origins are only in trusted origin allowlists.
- Confirm cookie and revocation behavior:
- Sign out and server-side session invalidation propagate within accepted cache window.
- Protected endpoints reject invalidated sessions consistently.
- Confirm hash migration readiness:
- Current verifier behavior is documented for v1 hash format.
- v2 format discriminator and migration trigger are defined before any KDF/parameter changes.
- Confirm observability:
- Dashboards/queries exist for auth failures, `1102`, and workflow denials.
- A load-test smoke run verifies no unacceptable auth regression.

## Acceptance Criteria

- Brute-force attempts are throttled and visible in logs.
- Workflow abuse from a single actor is bounded.
- CORS and trusted origin checks prevent cross-origin session abuse.
- Incident triage can identify actor, endpoint, and time window.
- Unauthenticated calls to generation endpoints are denied consistently.
- Generation UI is inaccessible/disabled unless signed in.
- `BETTER_AUTH_URL` and trusted origin configuration are semantically correct and documented.
- Hash format migration plan exists before any future hash-strength change is attempted.

## Open Decisions

- Rate limiter storage: Durable Object vs KV-backed strategy.
- Exact per-route rate thresholds for free-plan cost control.
