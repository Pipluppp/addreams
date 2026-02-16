# 2026-02-17 Auth Follow-Up Plan Index

This plan set is the direct continuation of `docs/plans/2026-02-16-account-auth/` and explicitly accounts for findings documented in:

- `docs/plans/2026-02-16-account-auth/analysis.md`

## Core Issues Accounted For

- `C1` Brute-force hardening gaps (IP header trust + explicit rate limit config): owned by Step 05 `security-hardening`.
- `H1` `BETTER_AUTH_URL` / `baseURL` semantics mismatch: owned by Step 05 `security-hardening`.
- `H2` Password hash versioning strategy gap: owned by Step 05 `security-hardening`.
- `H3` CPU-limit hotspot and observability guardrails: owned by Step 05 `security-hardening`, supported by Step 02 `user-credits`.
- `M1` `requireEmailVerification: false` tradeoff: handled in Step 04 `auth-ux` messaging now, full behavior revisit later.
- `M2` `cookieCache` revocation consistency testing: owned by Step 05 `security-hardening`.
- `L1` workers.dev URL inference brittleness (`VITE_AUTH_BASE_URL` / `VITE_API_BASE_URL`): owned by Step 04 `auth-ux`.
- `L2` Dual allowlist synchronization (CORS + Better Auth trusted origins): owned by Step 05 `security-hardening`.

## Execution Order

1. `auth-gating`
2. `user-credits`
3. `history-gen`
4. `auth-ux`
5. `security-hardening`

## Progress Update (2026-02-17)

- Step 01 `auth-gating`: planned
- Step 02 `user-credits`: planned
- Step 03 `history-gen`: planned
- Step 04 `auth-ux`: implemented and verified in frontend
- Step 05 `security-hardening`: planned

## Step Documents

1. `docs/plans/2026-02-17/auth-gating/README.md`
2. `docs/plans/2026-02-17/user-credits/README.md`
3. `docs/plans/2026-02-17/history-gen/README.md`
4. `docs/plans/2026-02-17/auth-ux/README.md`
5. `docs/plans/2026-02-17/security-hardening/README.md`
