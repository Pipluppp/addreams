# 07 — Migration, Deployment & Implementation Order

> Updated with corrected migration workflow (programmatic auth migrations + drizzle-kit for custom tables), credits system phases, verified against official docs.

## Implementation Phases

### Phase 1: Infrastructure (Backend Only)

**Goal:** D1 + R2 + Drizzle wired up, application tables migrated, no user-facing changes yet.

1. Install backend dependencies: `better-auth`, `drizzle-orm`, `drizzle-kit`
2. Add `nodejs_compat` flag to `backend/wrangler.jsonc`
3. Create D1 database: `wrangler d1 create addreams-db`
4. Create R2 bucket: `wrangler r2 bucket create addreams-generations`
5. Add D1 and R2 bindings to `backend/wrangler.jsonc` (with correct `database_id`)
6. Set `migrations_dir: "drizzle"` in wrangler config
7. Write `backend/drizzle.config.ts` (dialect: `sqlite`, driver: `d1-http`)
8. Write `backend/src/db/schema.ts` (user_profile, generation tables)
9. Write `backend/src/db/index.ts` (DB factory)
10. Generate migrations: `npx drizzle-kit generate`
11. Apply migrations locally: `wrangler d1 migrations apply addreams-db --local`
12. Update `WorkerBindings` type (run `wrangler types`)
13. Create `.dev.vars` (Wrangler secrets) and `.env` (drizzle-kit credentials)
14. Add both to `.gitignore`

**Verification:**
```bash
# Backend starts without errors
npm run dev -w backend

# Application tables exist locally
wrangler d1 execute addreams-db --local --command "SELECT name FROM sqlite_master WHERE type='table'"
# Should show: user_profile, generation, d1_migrations
```

### Phase 2: Auth Backend

**Goal:** better-auth routes functional, can sign up / sign in via API.

1. Write `backend/src/auth/options.ts` (static config with `basePath: "/api/auth"`)
2. Write `backend/src/auth/index.ts` (`createAuth(env)` factory)
3. Write `backend/src/auth/middleware.ts` (authMiddleware, optionalAuthMiddleware)
4. Add programmatic migration endpoint: `POST /api/migrate`
5. Mount auth routes in `backend/src/index.ts`: `app.on(["GET","POST"], "/api/auth/*", ...)`
6. Add CORS configuration with `credentials: true` (before auth routes)
7. Add `/api/me` endpoint with profile + credits
8. Hit migration endpoint to create better-auth tables locally:
   ```bash
   curl -X POST http://localhost:8787/api/migrate
   ```
9. Test auth flow:
   ```bash
   # Sign up
   curl -X POST http://localhost:8787/api/auth/sign-up/email \
     -H "Content-Type: application/json" \
     -d '{"name":"Test","email":"test@test.com","password":"password123"}' \
     -c cookies.txt

   # Get session
   curl http://localhost:8787/api/auth/session -b cookies.txt

   # Get profile with credits
   curl http://localhost:8787/api/me -b cookies.txt
   ```

**Verification:** Full sign-up → sign-in → session → profile+credits flow works via HTTP. user_profile row created with `creditsProductShoots: 1, creditsAdGraphics: 1`.

### Phase 3: Auth Frontend

**Goal:** Users can sign up, log in, see profile with credits, sign out.

1. Install frontend dependency: `better-auth`
2. Write `frontend/src/lib/auth-client.ts` (baseURL: `""` for same-origin proxy)
3. Write `frontend/src/components/auth/require-auth.tsx`
4. Write `frontend/src/pages/login.tsx` (email + social buttons)
5. Write `frontend/src/pages/sign-up.tsx` (name, email, password)
6. Write `frontend/src/pages/profile.tsx` (shows credits, account type)
7. Add routes to `frontend/src/App.tsx`
8. Update `AppShellLayout` header with UserNav (sign in / avatar dropdown)

**Verification:** End-to-end sign-up → login → profile (shows 1/1 credits) → sign-out in browser.

### Phase 4: Generation Persistence + Credits

**Goal:** Workflow results saved to D1 + R2, credits enforced.

1. Refactor workflow handlers into `backend/src/routes/workflows.ts`
2. Gate `/api/workflows/*` behind `authMiddleware`
3. Add `ensureProfile()` helper
4. Add credit check: `credits > 0` or return 403
5. Add credit decrement before generation
6. On generation: create DB record → call Qwen → download images → upload to R2 → update DB record
7. Write `backend/src/routes/generations.ts` (list, get, delete, serve images)
8. Mount routes in `backend/src/index.ts`
9. Update frontend mutation handlers to show credits remaining in response

**Verification:**
- Generate an image → credit decremented (1 → 0)
- Try again → 403 "No credits remaining"
- Generation appears in D1
- Images accessible via `/api/generations/:id/images/0`

### Phase 5: History Frontend

**Goal:** Users see their past generations in a gallery.

1. Write `frontend/src/features/history/queries.ts` (Tanstack Query hooks)
2. Write generation grid and card components
3. Write `frontend/src/pages/history.tsx`
4. Add "History" to navigation (authenticated users only)
5. Add generation detail modal
6. Show credits remaining on workflow pages
7. Show "no credits" state with upgrade prompt (placeholder for paid plans)

**Verification:** Generate images → /history shows gallery → click for details → delete works → credits display is accurate.

### Phase 6: OAuth Setup

**Goal:** Google and GitHub social login working.

1. Create Google OAuth credentials in Google Cloud Console
2. Create GitHub OAuth App in GitHub Developer Settings
3. Add redirect URIs:
   - Google: `http://localhost:8787/api/auth/callback/google`
   - GitHub: `http://localhost:8787/api/auth/callback/github`
4. Add client IDs/secrets to `.dev.vars`
5. Test OAuth flows locally
6. Add production redirect URIs
7. Set production secrets via `wrangler secret put`
8. Add social login buttons to login/signup pages

**Verification:** Click "Continue with Google" → OAuth flow → user created → profile with credits → logged in.

## Production Deployment Checklist

### Cloudflare Resources
- [ ] D1 database created: `wrangler d1 create addreams-db`
- [ ] R2 bucket created: `wrangler r2 bucket create addreams-generations`

### Migrations
- [ ] Application tables: `wrangler d1 migrations apply addreams-db --remote`
- [ ] Deploy Worker code (with `/api/migrate` endpoint)
- [ ] Auth tables: `curl -X POST https://addreams-api.duncanb013.workers.dev/api/migrate`
- [ ] Remove or protect migration endpoint in subsequent deploy

### Production Secrets (via `wrangler secret put`)
- [ ] `BETTER_AUTH_SECRET` — Random 32+ character string
- [ ] `BETTER_AUTH_URL` — `https://addreams-api.duncanb013.workers.dev`
- [ ] `BETTER_AUTH_TRUSTED_ORIGINS` — `https://addreams-web.duncanb013.workers.dev`
- [ ] `GOOGLE_CLIENT_ID`
- [ ] `GOOGLE_CLIENT_SECRET`
- [ ] `GITHUB_CLIENT_ID`
- [ ] `GITHUB_CLIENT_SECRET`
- [ ] `QWEN_API_KEY` (already exists)

### OAuth Redirect URIs (Production)
- [ ] Google: `https://addreams-api.duncanb013.workers.dev/api/auth/callback/google`
- [ ] GitHub: `https://addreams-api.duncanb013.workers.dev/api/auth/callback/github`

### Deploy Order
```bash
# 1. Set all secrets first
cd backend && wrangler secret put BETTER_AUTH_SECRET  # ... etc

# 2. Apply Drizzle migrations to production D1
npm run db:migrate:remote -w backend

# 3. Deploy backend (includes migration endpoint)
npm run deploy:backend

# 4. Run auth migrations
curl -X POST https://addreams-api.duncanb013.workers.dev/api/migrate

# 5. Deploy frontend
npm run deploy:frontend

# 6. Re-deploy backend WITHOUT migration endpoint (optional, for security)
# Remove the POST /api/migrate route, then:
npm run deploy:backend
```

### Post-Deploy Verification
- [ ] `/api/health` returns OK
- [ ] Sign up with email creates user + profile with credits
- [ ] Sign in with email works
- [ ] Google OAuth flow completes
- [ ] GitHub OAuth flow completes
- [ ] `/api/me` returns user + profile + credits
- [ ] Image generation decrements credit
- [ ] 0-credit user gets 403
- [ ] Generated images stored in R2 and accessible
- [ ] `/history` shows past generations
- [ ] Delete generation removes DB record + R2 objects
- [ ] Sign out clears session

## Rollback Plan

If auth breaks in production:

1. **Auth routes can be disabled** by removing the auth route mount — existing non-gated endpoints remain functional.
2. **D1 data is preserved** — Rolling back code doesn't affect the database.
3. **R2 objects persist** independently of code deployments.
4. **Credits can be manually adjusted** via `wrangler d1 execute`:
   ```bash
   wrangler d1 execute addreams-db --remote \
     --command "UPDATE user_profile SET credits_product_shoots = 1 WHERE user_id = '...'"
   ```

## Security Considerations

- [ ] `BETTER_AUTH_SECRET` is cryptographically random and never committed to git
- [ ] `.dev.vars` and `.env` are in `.gitignore`
- [ ] OAuth secrets are only in Wrangler secrets, never in code
- [ ] `httpOnly` cookies prevent XSS token theft
- [ ] `sameSite: lax` prevents CSRF on state-changing requests
- [ ] User can only access their own generations (userId check in all queries)
- [ ] R2 images served through authenticated endpoint, not public bucket
- [ ] Input validation on all user-provided fields (Zod schemas)
- [ ] Migration endpoint removed after initial setup
- [ ] Consider Cloudflare rate limiting rules on `/api/auth/*` to prevent brute force

## Git Strategy

```
main
  └── feat/auth-and-history
        ├── Phase 1: Infrastructure (D1, R2, Drizzle)
        ├── Phase 2: Auth backend (better-auth, middleware)
        ├── Phase 3: Auth frontend (login, signup, profile)
        ├── Phase 4: Generation persistence + credits
        ├── Phase 5: History UI (gallery page)
        └── Phase 6: OAuth providers
```

Each phase can be a separate commit or PR — they build on each other sequentially.
