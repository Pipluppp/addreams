# Account/Auth Verification + Setup

## Local Setup

1. Start backend worker:
```bash
npm run dev -w backend
```
2. Start frontend Vite:
```bash
npm run dev -w frontend
```
3. Open:
- `http://127.0.0.1:5173/login`

Notes:
- Frontend proxies `/api` to `http://127.0.0.1:8787`.
- Local data is written to local D1 state.

## Miniflare/Worker-Style Local

Backend:
```bash
npm run dev -w backend
```
Frontend worker preview (optional):
```bash
npm run dev:worker -w frontend
```

## Production Setup

Deploy backend:
```bash
npm run deploy -w backend
```
Deploy frontend:
```bash
npm run deploy -w frontend
```
Apply remote D1 migrations when needed:
```bash
npm run db:migrate:remote -w backend
```

## Verify Local vs Remote D1

From repo root:

Local:
```bash
npx wrangler d1 execute DB --local --command "select count(*) as users from user;" --config backend/wrangler.jsonc
```

Remote:
```bash
npx wrangler d1 execute addreams-db --remote --command "select count(*) as users from user;" --config backend/wrangler.jsonc
```

## API Verification Checks

Health:
```bash
curl -i https://addreams-api.duncanb013.workers.dev/api/health
```

Sign up:
```bash
curl -i -X POST 'https://addreams-api.duncanb013.workers.dev/api/auth/sign-up/email' \
  -H 'content-type: application/json' \
  -H 'origin: https://addreams-web.duncanb013.workers.dev' \
  --data '{"name":"Test User","email":"test@example.com","password":"Passw0rd!2345"}'
```

Sign in:
```bash
curl -i -X POST 'https://addreams-api.duncanb013.workers.dev/api/auth/sign-in/email' \
  -H 'content-type: application/json' \
  -H 'origin: https://addreams-web.duncanb013.workers.dev' \
  --data '{"email":"test@example.com","password":"Passw0rd!2345"}'
```

Profile with cookie session:
```bash
curl -i 'https://addreams-api.duncanb013.workers.dev/api/me' \
  -H 'origin: https://addreams-web.duncanb013.workers.dev' \
  -b cookies.txt -c cookies.txt
```

## References

- Resend sender-domain restriction: https://resend.com/docs/knowledge-base/403-error-resend-dev-domain
- Better Auth email/password docs: https://www.better-auth.com/docs/authentication/email-password
