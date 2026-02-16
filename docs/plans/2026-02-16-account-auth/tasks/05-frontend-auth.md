# 05 — Frontend Auth: Client, Context, Sign-Up/Login/Profile Pages

> Updated with credits display, no email verification, account type concept.

## Auth Client Setup

### `frontend/src/lib/auth-client.ts`

```typescript
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  // Empty baseURL = same origin (requests go through frontend worker proxy to backend)
  baseURL: "",
  fetchOptions: {
    credentials: "include",
  },
});

export const { signIn, signUp, signOut, useSession, getSession } = authClient;
```

**Why empty baseURL?** The frontend worker already proxies `/api/*` to the backend. This means auth cookies are same-origin, avoiding CORS complexity.

## Install Frontend Dependency

```bash
cd frontend
npm install better-auth
```

Only the `better-auth/react` client module is used — no server-side code in the frontend bundle.

## New Routes

Add to `frontend/src/App.tsx`:

```typescript
const LoginRoute = lazy(() => import("./pages/login"));
const SignUpRoute = lazy(() => import("./pages/sign-up"));
const ProfileRoute = lazy(() => import("./pages/profile"));
const HistoryRoute = lazy(() => import("./pages/history"));

// In router:
<Route path="/login" element={<Suspense fallback={<RouteLoadingFrame />}><LoginRoute /></Suspense>} />
<Route path="/sign-up" element={<Suspense fallback={<RouteLoadingFrame />}><SignUpRoute /></Suspense>} />
<Route path="/profile" element={<Suspense fallback={<RouteLoadingFrame />}><ProfileRoute /></Suspense>} />
<Route path="/history" element={<Suspense fallback={<RouteLoadingFrame />}><HistoryRoute /></Suspense>} />
```

## Auth Guard Component

A wrapper that redirects unauthenticated users to login:

### `frontend/src/components/auth/require-auth.tsx`

```typescript
import { useSession } from "@/lib/auth-client";
import { Navigate, useLocation } from "react-router-dom";
import { Spinner } from "@heroui/react";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = useSession();
  const location = useLocation();

  if (isPending) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return <>{children}</>;
}
```

Usage in routes:

```typescript
<Route path="/profile" element={
  <RequireAuth>
    <Suspense fallback={<RouteLoadingFrame />}><ProfileRoute /></Suspense>
  </RequireAuth>
} />
```

## Login Page

### `frontend/src/pages/login.tsx`

Key elements:
- Email/password form
- Social login buttons (Google, GitHub)
- Link to sign-up page
- Redirect to original page after login (`location.state.from`)

```typescript
import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { signIn } from "@/lib/auth-client";
import { Button, TextField, Form, Surface, Separator } from "@heroui/react";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from ?? "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await signIn.email({ email, password });
    if (result.error) {
      setError(result.error.message);
      setLoading(false);
    } else {
      navigate(from, { replace: true });
    }
  }

  async function handleSocialLogin(provider: "google" | "github") {
    await signIn.social({
      provider,
      callbackURL: from,
    });
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <Surface className="w-full max-w-sm p-6 space-y-6">
        <h1 className="text-2xl font-semibold text-center">Sign in</h1>

        {/* Social buttons */}
        <div className="space-y-3">
          <Button
            variant="outline"
            fullWidth
            onPress={() => handleSocialLogin("google")}
          >
            Continue with Google
          </Button>
          <Button
            variant="outline"
            fullWidth
            onPress={() => handleSocialLogin("github")}
          >
            Continue with GitHub
          </Button>
        </div>

        <Separator>or</Separator>

        {/* Email/password form */}
        <Form onSubmit={handleEmailLogin} className="space-y-4">
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            isRequired
            autoComplete="email"
          />
          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={setPassword}
            isRequired
            autoComplete="current-password"
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button type="submit" fullWidth isLoading={loading}>
            Sign in
          </Button>
        </Form>

        <p className="text-center text-sm">
          Don't have an account? <Link to="/sign-up" className="underline">Sign up</Link>
        </p>
      </Surface>
    </div>
  );
}
```

## Sign-Up Page

### `frontend/src/pages/sign-up.tsx`

Similar to login but with name field and `signUp.email()`:

```typescript
import { signUp } from "@/lib/auth-client";

// Fields: name, email, password, confirmPassword
// On submit:
const result = await signUp.email({
  name,
  email,
  password,
});
```

## Profile Page

### `frontend/src/pages/profile.tsx`

Shows user info, account type, remaining credits, allows editing name/image, sign-out button.

```typescript
import { useSession, signOut, authClient } from "@/lib/auth-client";
import { useQuery } from "@tanstack/react-query";

function useProfile() {
  const { data: session } = useSession();
  return useQuery({
    queryKey: ["me"],
    queryFn: () => fetch("/api/me", { credentials: "include" }).then((r) => r.json()),
    enabled: !!session,
  });
}

export default function ProfilePage() {
  const { data: session } = useSession();
  const { data: meData } = useProfile();

  if (!session) return null;

  const { user } = session;
  const profile = meData?.profile;

  return (
    <div className="max-w-lg mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Profile</h1>

      {/* Avatar + info */}
      <Avatar src={user.image} name={user.name} size="lg" />
      <div>
        <p className="text-lg font-medium">{user.name}</p>
        <p className="text-sm text-muted">{user.email}</p>
      </div>

      {/* Account type + credits */}
      {profile && (
        <Surface className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Chip variant={profile.accountType === "paid" ? "solid" : "outline"}>
              {profile.accountType === "paid" ? "Paid" : "Free"}
            </Chip>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted">Product Shoots</p>
              <p className="text-lg font-medium">{profile.credits.productShoots} credits</p>
            </div>
            <div>
              <p className="text-sm text-muted">Ad Graphics</p>
              <p className="text-lg font-medium">{profile.credits.adGraphics} credits</p>
            </div>
          </div>
        </Surface>
      )}

      {/* Edit name form */}
      {/* ... */}

      {/* Sign out */}
      <Button
        variant="outline"
        onPress={async () => {
          await signOut();
          navigate("/");
        }}
      >
        Sign out
      </Button>
    </div>
  );
}
```

## Navigation Updates

Update `AppShellLayout` to show auth state in the header:

### Header (logged out)
```
[Logo]  Product Shoots  Ad Graphics              [Sign In]
```

### Header (logged in)
```
[Logo]  Product Shoots  Ad Graphics  History     [Avatar ▼]
                                                   Profile
                                                   History
                                                   Sign Out
```

Implementation:

```typescript
// In AppShellLayout header
import { useSession, signOut } from "@/lib/auth-client";
import { Dropdown, Avatar, Button } from "@heroui/react";

function UserNav() {
  const { data: session, isPending } = useSession();

  if (isPending) return null;

  if (!session) {
    return (
      <Link to="/login">
        <Button variant="outline" size="sm">Sign In</Button>
      </Link>
    );
  }

  return (
    <Dropdown>
      <Dropdown.Trigger>
        <Avatar
          src={session.user.image}
          name={session.user.name}
          size="sm"
          className="cursor-pointer"
        />
      </Dropdown.Trigger>
      <Dropdown.Menu>
        <Dropdown.Item key="profile" href="/profile">Profile</Dropdown.Item>
        <Dropdown.Item key="history" href="/history">History</Dropdown.Item>
        <Dropdown.Separator />
        <Dropdown.Item key="signout" onAction={() => signOut()}>
          Sign Out
        </Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
  );
}
```

## Auth State & Tanstack Query Integration

The `useSession()` hook from better-auth/react handles caching internally. For custom queries that need the user, wrap them:

```typescript
import { useSession } from "@/lib/auth-client";
import { useQuery } from "@tanstack/react-query";

function useGenerationHistory() {
  const { data: session } = useSession();

  return useQuery({
    queryKey: ["generations"],
    queryFn: () => fetch("/api/generations").then((r) => r.json()),
    enabled: !!session, // Only fetch when authenticated
  });
}
```

## File Structure (Frontend After Changes)

```
frontend/src/
├── lib/
│   ├── api.ts                    # Existing API client
│   ├── auth-client.ts            # NEW: better-auth React client
│   └── dependencies.ts           # Existing DI
├── components/
│   ├── auth/
│   │   └── require-auth.tsx      # NEW: Auth guard
│   ├── atoms/                    # Existing
│   ├── molecules/                # Existing
│   ├── organisms/                # Existing
│   └── layouts/
│       └── app-shell-layout.tsx  # MODIFIED: Add UserNav
├── pages/
│   ├── login.tsx                 # NEW
│   ├── sign-up.tsx               # NEW
│   ├── profile.tsx               # NEW
│   └── history.tsx               # NEW (see 06-frontend-history.md)
├── features/                     # Existing feature modules
├── App.tsx                       # MODIFIED: Add new routes
└── main.tsx                      # No changes needed
```

## Jotai Integration (Optional)

If we want global auth state accessible outside React components (e.g., in Jotai atoms):

```typescript
// frontend/src/lib/auth-atoms.ts
import { atom } from "jotai";
import { getSession } from "./auth-client";

// Derived atom that checks session
export const sessionAtom = atom(async () => {
  const session = await getSession();
  return session.data;
});
```

This is optional — `useSession()` hook is sufficient for most cases.

## HeroUI Components Used

Reference the HeroUI docs for correct v3 API:
- **Button** — Sign in/up buttons, social login
- **Surface** — Card-like container for forms
- **Separator** — "or" divider between social and email login
- **TextField** — Email, password, name inputs
- **Form** — Form wrapper with validation
- **Avatar** — User avatar in nav and profile
- **Dropdown** — User menu in header
- **Spinner** — Loading states
- **Alert** — Error messages

> Always check `.heroui-docs/react/` before using these components — v3 API may differ from what you remember.
