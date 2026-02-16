# Task 1 Checklist (Auth) + Mailgun -> Resend Migration

**Date:** 2026-02-16  
**Status:** Task 1 mostly working locally; production setup and provider switch still pending.

## 1) Remaining TODO Checklist (Current Codebase)

- [x] Fix trusted origins for frontend worker dev mode.
  - Added `http://localhost:8788` and `http://127.0.0.1:8788` to `TRUSTED_ORIGINS`.
  - Browser-origin auth actions through `frontend` worker now succeed.

- [x] Fix swapped routes in `frontend/src/App.tsx`.
  - `path="product-shoots"` currently renders `AdGraphicsRoute`.
  - `path="ad-graphics"` currently renders `ProductShootsRoute`.

- [x] Fix state update during render in `frontend/src/routes/profile.tsx`.
  - Current `setName(...)` and `setNameInitialized(...)` run in render path.
  - Move this initialization into `useEffect`.

- [x] Update `backend/.dev.vars.example` with new auth/email variables so fresh setup is reproducible.

- [ ] Set production auth vars/secrets before deploy (`BETTER_AUTH_URL`, `TRUSTED_ORIGINS`, `ENVIRONMENT`, auth secret, email provider secret).
  - Production vars are now set in `backend/wrangler.jsonc`.
  - Remaining: production secrets in Cloudflare (`BETTER_AUTH_SECRET`, `RESEND_API_KEY`).

- [x] Reinstall dependencies in the active OS environment if needed.
  - Build/generate errors showed platform-specific optional dependency mismatch (`esbuild` / `rollup`) in WSL/Linux vs Windows installs.

## 2) Mailgun -> Resend Migration Checklist

### A. Resend account + domain setup

- [ ] Create/confirm Resend account.
- [ ] Add a sending domain in Resend (recommended: subdomain like `mail.yourdomain.com`).
- [ ] Verify domain DNS records (SPF + DKIM required; DMARC recommended).
- [ ] Create API key (`sending_access` is sufficient for this service).
- [ ] Choose sender address for OTP emails (example: `addreams <noreply@mail.yourdomain.com>`).

Notes:
- If you use `resend.dev` (testing domain), Resend restricts sending to your own account email.
- To send OTPs to real users, use your verified domain in `from`.

### B. Environment + secret changes

Replace Mailgun env vars with Resend vars:

- [x] Remove:
  - `MAILGUN_API_KEY`
  - `MAILGUN_DOMAIN`
  - `MAILGUN_FROM`
- [x] Add:
  - `RESEND_API_KEY`
  - `RESEND_FROM`

Files/places to update:
- [x] `backend/.dev.vars`
- [x] `backend/.dev.vars.example`
- [x] Worker bindings typing in `backend/src/index.ts`
- Wrangler production secrets (`wrangler secret put RESEND_API_KEY`)
- Optional cleanup: remove old Mailgun secrets from Cloudflare when cutover is complete

### C. Backend OTP sender implementation changes (`backend/src/auth.ts`)

- [x] Keep development fallback (console OTP) or make it configurable.
- [x] Replace Mailgun POST call with Resend Email API call:
  - `POST https://api.resend.com/emails`
  - Header: `Authorization: Bearer <RESEND_API_KEY>`
  - Header: `Content-Type: application/json`
  - Body fields:
    - `from` -> `RESEND_FROM`
    - `to` -> `[email]`
    - `subject` -> OTP subject
    - `text` (or `html`) -> OTP message
- [x] Handle non-2xx responses explicitly (log body + throw error).
- [x] Optional: add `Idempotency-Key` to avoid duplicate sends on retries.

Suggested request shape:

```ts
await fetch("https://api.resend.com/emails", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${env.RESEND_API_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    from: env.RESEND_FROM,
    to: [email],
    subject: `Your addreams code: ${otp}`,
    text: `Your verification code is: ${otp}\n\nThis code expires in 5 minutes.`,
  }),
});
```

## 3) Verification Checklist (Local / Miniflare / Production)

### Local (`npm run dev`, Vite + backend worker)

- [ ] Run DB migration locally:
  - `npm run db:migrate:local -w backend`
- [ ] Start app:
  - `npm run dev`
- [ ] Validate OTP auth flow:
  - `/login` -> send code -> verify code -> redirect to `/profile?setup=true` for first login
  - Set name -> profile persists
  - Sign out -> protected route redirects to login
- [ ] Confirm session persistence across reloads.

Expected behavior:
- In `ENVIRONMENT=development`, OTP logs to backend console (unless dev fallback is changed).

### Miniflare / Wrangler worker mode

- [x] Start backend worker:
  - `npm run dev -w backend`
- [x] Start frontend worker:
  - `npm run dev:worker -w frontend`
- [x] Use `http://localhost:8788` and run same auth/profile checks.
- [x] Ensure `TRUSTED_ORIGINS` includes `http://localhost:8788` and `http://127.0.0.1:8788`.

### Production

- [x] Set backend vars (non-secret):
  - `BETTER_AUTH_URL` -> frontend public origin
  - `TRUSTED_ORIGINS` -> comma-separated production origins
  - `ENVIRONMENT=production`
- [ ] Set backend secrets:
  - `BETTER_AUTH_SECRET`
  - `RESEND_API_KEY`
- [x] Apply remote DB migrations:
  - `npm run db:migrate:remote -w backend`
- [x] Deploy backend, then frontend.
- [ ] Run live OTP test with real destination emails.
  - Current status: production OTP endpoint now returns `200` from API checks.

## 4) Recommended Deployment Order for Resend Cutover

1. Add Resend domain + verify DNS.
2. Create `RESEND_API_KEY`.
3. Add `RESEND_API_KEY` secret and `RESEND_FROM` var in backend environments.
4. Deploy backend with Resend integration.
5. Test OTP sign-in in production.
6. Remove old Mailgun secrets/config once confirmed.

## 5) References

- Resend API introduction: https://resend.com/docs/api-reference/introduction
- Resend send email endpoint: https://resend.com/docs/api-reference/emails/send-email
- Resend with Hono: https://resend.com/docs/send-with-hono
- Resend domain management: https://resend.com/docs/dashboard/domains/introduction
- Resend Cloudflare DNS setup notes: https://resend.com/docs/knowledge-base/cloudflare
- Resend `resend.dev` 403 limitation: https://resend.com/docs/knowledge-base/403-error-resend-dev-domain
