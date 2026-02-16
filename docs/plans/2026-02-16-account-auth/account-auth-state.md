# Account/Auth State

## Current Production Status

- Auth system is live on Cloudflare Workers with Better Auth + D1 + Drizzle.
- Active auth mode: email/password.
- Login page supports:
  - Sign in with email/password.
  - Create account with name/email/password.
- Profile flow is working:
  - session-based `/api/me`
  - update name
  - sign out

## Why OTP Is Not the Active Production Mode

- Project does not currently have a verified sender domain.
- Without a verified sender domain, production-grade OTP / verification-email / password-reset-email to arbitrary users is not reliable.
- Therefore current mode is email/password with:
  - `requireEmailVerification: false`

## Active Deployment Snapshot

- Backend Worker: `addreams-api`
  - version `44d8b0b6-a623-4bb4-bd16-2dac36789a1e`
- Frontend Worker: `addreams-web`
  - version `60a96e23-1970-4cec-9b56-3dd20a14304e`

## Active Files

- Backend auth config: `backend/src/auth.ts`
- Backend worker config: `backend/wrangler.jsonc`
- Frontend auth client: `frontend/src/lib/auth-client.ts`
- Frontend login flow: `frontend/src/routes/login.tsx`

## Remaining Manual Work

- Nothing required to keep current email/password auth functional.
- Deferred until sender domain exists:
  - email verification on sign-up
  - password reset by email
