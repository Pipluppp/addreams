# Account/Auth Hashing Diagnosis

## Active Hashing Strategy

`backend/src/auth.ts` overrides Better Auth password hashing using native `node:crypto` scrypt:
- `hash = saltHex:keyHex`
- `verify` recomputes and compares with `timingSafeEqual`
- parameters:
  - `N=16384`
  - `r=16`
  - `p=1`
  - `dkLen=64`

## Implementation Origin

Yes, this implementation was adopted from the Better Auth Cloudflare discussion pattern in issue `#969`:
- base idea: override Better Auth default password hashing with native `node:crypto` scrypt
- references:
  - https://github.com/better-auth/better-auth/issues/969#issuecomment-2833532886
  - https://github.com/better-auth/better-auth/issues/969#issuecomment-3024999773

Project-specific details retained:
- explicit `timingSafeEqual` comparison
- fixed scrypt parameters documented above
- `salt:key` hex string format persisted in `account.password`

## Verification That Custom Hashing Is In Use

Remote D1 check for a new user credential row showed:
- password length: `161`
- contains `:` separator
- matches hex `salt:key` pattern (`[0-9a-f]*:[0-9a-f]*`)

## A/B Production Test: Default Better Auth Hashing vs Custom

Both variants were benchmarked against production auth endpoints.

### Custom hashing (kept)
- signup once: `200` (~1.10s)
- sign-in sequential 20 req: `20/20` success
- sign-in parallel 30 req (concurrency 6): `30/30` success
- sign-up parallel 8 req (concurrency 4): `8/8` success

### Default Better Auth hashing (tested, rejected)
- signup once: `200` (~0.76s)
- sign-in sequential 20 req: `14/20` success, `6/20` failed
- sign-in parallel 30 req (concurrency 6): `21/30` success, `9/30` failed
- sign-up parallel 8 req (concurrency 4): `4/8` success, `4/8` failed
- failure mode: Cloudflare `1102 Worker exceeded resource limits` (`503` responses)

## Decision

Keep custom native scrypt override as the default for this deployment target.
Default Better Auth hashing is not reliable enough under this runtime limit profile.

## Hashing Verification Plan (No New Benchmarks)

Use this checklist whenever auth hashing logic changes:

1. Verify code path is still custom:
- check `backend/src/auth.ts` contains `emailAndPassword.password.hash/verify` overrides.
- confirm imports include `node:crypto` (`scryptSync`, `timingSafeEqual`).

2. Verify parameter drift has not occurred:
- confirm `N=16384`, `r=16`, `p=1`, `dkLen=64`.
- confirm output format remains `saltHex:keyHex`.

3. Verify persisted hash shape in remote D1:
- run:
```bash
npx wrangler d1 execute addreams-db --remote --config backend/wrangler.jsonc --command \"select length(password) as passwordLength, instr(password, ':') as hasColon, (password glob '[0-9a-f]*:[0-9a-f]*') as isHexish from account where provider_id='credential' order by created_at desc limit 5;\"
```
- expected:
  - `hasColon > 0`
  - `isHexish = 1`
  - `passwordLength` around `161` for current params

4. Verify functional sign-in remains healthy:
- perform a small smoke test (signup once + sign-in a few times) using `account-auth-verification-setup.md` commands.
- if any `1102` appears, treat as regression and keep/revert to custom override.

## Relevant Links

- Better Auth issue discussion: https://github.com/better-auth/better-auth/issues/969
- Comment (node crypto custom hash): https://github.com/better-auth/better-auth/issues/969#issuecomment-2833532886
- Comment (same approach, worker context): https://github.com/better-auth/better-auth/issues/969#issuecomment-3024999773
- Cloudflare Worker limits/pricing: https://developers.cloudflare.com/workers/platform/pricing/
