import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Alert, Button, Card, Form, Input, Label, Skeleton, Spinner, Tabs } from "@heroui/react";
import { authClient, useSession } from "../lib/auth-client";
import { resolveRuntimeConfig } from "../lib/runtime-config";

type Mode = "sign-in" | "sign-up";

type FieldErrors = {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginRoute() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const rawRedirect = searchParams.get("redirect") ?? "/";
  const redirect = rawRedirect.startsWith("/") ? rawRedirect : "/";
  const runtimeConfig = useMemo(() => resolveRuntimeConfig(), []);
  const { data: session, isPending: isSessionPending } = useSession();

  const [mode, setMode] = useState<Mode>("sign-in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [authError, setAuthError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!session) return;
    navigate(redirect, { replace: true });
  }, [navigate, redirect, session]);

  function resetTransientErrors() {
    setAuthError(null);
    setFieldErrors({});
  }

  function handleModeChange(nextMode: Mode) {
    setMode(nextMode);
    setConfirmPassword("");
    resetTransientErrors();
  }

  function validateForm(): FieldErrors {
    const nextErrors: FieldErrors = {};

    if (mode === "sign-up" && !name.trim()) {
      nextErrors.name = "Name is required.";
    }

    if (!email.trim()) {
      nextErrors.email = "Email is required.";
    } else if (!EMAIL_PATTERN.test(email.trim())) {
      nextErrors.email = "Enter a valid email format.";
    }

    if (!password.trim()) {
      nextErrors.password = "Password is required.";
    } else if (password.trim().length < 8) {
      nextErrors.password = "Password must be at least 8 characters.";
    }

    if (mode === "sign-up") {
      if (!confirmPassword.trim()) {
        nextErrors.confirmPassword = "Please confirm your password.";
      } else if (password !== confirmPassword) {
        nextErrors.confirmPassword = "Passwords do not match.";
      }
    }

    return nextErrors;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    resetTransientErrors();

    const nextErrors = validateForm();
    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      return;
    }

    setLoading(true);
    try {
      const result =
        mode === "sign-in"
          ? await authClient.signIn.email({ email: email.trim(), password })
          : await authClient.signUp.email({
              email: email.trim(),
              password,
              name: name.trim(),
            });

      if (result.error) {
        setAuthError(mapAuthError(result.error.message, mode));
        return;
      }

      if (mode === "sign-up") {
        navigate("/profile?setup=true", { replace: true });
        return;
      }

      navigate(redirect, { replace: true });
    } catch (error) {
      setAuthError(mapAuthError(error instanceof Error ? error.message : null, mode));
    } finally {
      setLoading(false);
    }
  }

  const isSubmitDisabled =
    loading ||
    isSessionPending ||
    !email.trim() ||
    !password.trim() ||
    (mode === "sign-up" && (!name.trim() || !confirmPassword.trim()));

  if (isSessionPending) {
    return (
      <section className="container-shell flex min-h-[62vh] items-center justify-center py-10">
        <Card className="w-full max-w-lg space-y-4 p-6">
          <Skeleton className="h-6 w-1/2 rounded-md" />
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-10 w-full rounded-xl" />
        </Card>
      </section>
    );
  }

  return (
    <section className="container-shell flex min-h-[62vh] items-center justify-center py-10">
      <Card className="w-full max-w-2xl space-y-5 p-5 sm:p-7">
        <Card.Header>
          <Card.Title>Sign in to addreams</Card.Title>
          <Card.Description>
            Continue to protected workflows and generation history.
          </Card.Description>
        </Card.Header>

        {redirect !== "/" ? (
          <Alert status="accent">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>Redirect target saved</Alert.Title>
              <Alert.Description>After sign-in, you will return to {redirect}.</Alert.Description>
            </Alert.Content>
          </Alert>
        ) : null}

        {authError ? (
          <Alert status="danger">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>Authentication failed</Alert.Title>
              <Alert.Description>{authError}</Alert.Description>
            </Alert.Content>
          </Alert>
        ) : null}

        <Tabs
          variant="secondary"
          selectedKey={mode}
          onSelectionChange={(key) => handleModeChange(String(key) as Mode)}
        >
          <Tabs.ListContainer>
            <Tabs.List aria-label="Authentication mode" className="w-full *:flex-1">
              <Tabs.Tab id="sign-in">
                Sign In
                <Tabs.Indicator />
              </Tabs.Tab>
              <Tabs.Tab id="sign-up">
                Create Account
                <Tabs.Indicator />
              </Tabs.Tab>
            </Tabs.List>
          </Tabs.ListContainer>

          <Tabs.Panel id="sign-in" className="pt-4">
            <Form onSubmit={handleSubmit} className="space-y-4">
              <AuthTextField
                name="email"
                type="email"
                label="Email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setFieldErrors((current) => ({ ...current, email: undefined }));
                }}
                placeholder="you@example.com"
                autoComplete="email"
                error={fieldErrors.email}
              />
              <AuthTextField
                name="password"
                type="password"
                label="Password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setFieldErrors((current) => ({ ...current, password: undefined }));
                }}
                placeholder="Your password"
                autoComplete="current-password"
                error={fieldErrors.password}
              />
              <Button type="submit" variant="primary" className="w-full" isDisabled={isSubmitDisabled}>
                {loading ? (
                  <>
                    <Spinner color="current" size="sm" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </Form>
          </Tabs.Panel>

          <Tabs.Panel id="sign-up" className="space-y-4 pt-4">
            <Alert status="warning">
              <Alert.Indicator />
              <Alert.Content>
                <Alert.Title>Email verification is not enabled yet</Alert.Title>
                <Alert.Description>
                  Account creation currently does not prove inbox ownership. Do not rely on verified-email guarantees yet.
                </Alert.Description>
              </Alert.Content>
            </Alert>

            <Form onSubmit={handleSubmit} className="space-y-4">
              <AuthTextField
                name="name"
                type="text"
                label="Name"
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  setFieldErrors((current) => ({ ...current, name: undefined }));
                }}
                placeholder="Your name"
                autoComplete="name"
                error={fieldErrors.name}
              />
              <AuthTextField
                name="email"
                type="email"
                label="Email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setFieldErrors((current) => ({ ...current, email: undefined }));
                }}
                placeholder="you@example.com"
                autoComplete="email"
                error={fieldErrors.email}
              />
              <AuthTextField
                name="password"
                type="password"
                label="Password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setFieldErrors((current) => ({ ...current, password: undefined }));
                }}
                placeholder="At least 8 characters"
                autoComplete="new-password"
                error={fieldErrors.password}
              />
              <AuthTextField
                name="confirmPassword"
                type="password"
                label="Confirm Password"
                value={confirmPassword}
                onChange={(event) => {
                  setConfirmPassword(event.target.value);
                  setFieldErrors((current) => ({ ...current, confirmPassword: undefined }));
                }}
                placeholder="Repeat your password"
                autoComplete="new-password"
                error={fieldErrors.confirmPassword}
              />
              <Button type="submit" variant="primary" className="w-full" isDisabled={isSubmitDisabled}>
                {loading ? (
                  <>
                    <Spinner color="current" size="sm" />
                    Creating account...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>
            </Form>
          </Tabs.Panel>
        </Tabs>

        <EnvironmentChecklist
          authBaseUrl={runtimeConfig.authBaseUrl}
          apiBaseUrl={runtimeConfig.apiBaseUrl}
          mode={runtimeConfig.mode}
        />
      </Card>
    </section>
  );
}

function AuthTextField({
  name,
  type,
  label,
  value,
  onChange,
  placeholder,
  autoComplete,
  error,
}: {
  name: string;
  type: string;
  label: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  autoComplete?: string;
  error?: string;
}) {
  return (
    <div className="flex w-full flex-col gap-1">
      <Label>{label}</Label>
      <Input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className={error ? "border-danger text-danger" : undefined}
      />
      {error ? <p className="text-xs text-danger">{error}</p> : null}
    </div>
  );
}

function EnvironmentChecklist({
  authBaseUrl,
  apiBaseUrl,
  mode,
}: {
  authBaseUrl: string;
  apiBaseUrl: string;
  mode: "explicit-env" | "workers-dev-inferred" | "same-origin-proxy";
}) {
  return (
    <Card className="space-y-3 bg-canvas p-4">
      <Card.Header>
        <Card.Title className="text-sm">Environment Checklist</Card.Title>
        <Card.Description className="text-xs">
          Local Vite and custom domains should set explicit URLs to avoid workers.dev inference surprises.
        </Card.Description>
      </Card.Header>
      <div className="space-y-2 text-xs text-ink-soft">
        <p>
          Mode: <span className="font-semibold text-ink">{mode}</span>
        </p>
        <p>
          `VITE_AUTH_BASE_URL`:{" "}
          <span className="font-semibold text-ink">{authBaseUrl || "(same-origin)"}</span>
        </p>
        <p>
          `VITE_API_BASE_URL`:{" "}
          <span className="font-semibold text-ink">{apiBaseUrl || "(same-origin /api)"}</span>
        </p>
        <ul className="list-disc space-y-1 pl-4">
          <li>Local Vite + local backend worker: set both `VITE_AUTH_BASE_URL` and `VITE_API_BASE_URL`.</li>
          <li>workers.dev (`addreams-web.*` + `addreams-api.*`): inference works, but explicit env vars are safer.</li>
          <li>Custom domain deployments: always set explicit auth/api base URLs.</li>
          <li>If auth fails with cookie/session errors, verify backend trusted origins and credentialed requests.</li>
        </ul>
      </div>
    </Card>
  );
}

function mapAuthError(message: string | null | undefined, mode: Mode): string {
  const normalized = message?.toLowerCase() ?? "";

  if (normalized.includes("invalid") && normalized.includes("password")) {
    return "Invalid email or password. Check your credentials and try again.";
  }
  if (normalized.includes("already") && normalized.includes("exist")) {
    return "An account already exists for that email. Sign in instead.";
  }
  if (normalized.includes("network") || normalized.includes("fetch")) {
    return "Cannot reach the auth server. Verify your auth/api base URLs and backend availability.";
  }
  if (normalized.includes("cookie") || normalized.includes("session")) {
    return "Your session cookie is missing or expired. Sign in again.";
  }
  if (mode === "sign-up") {
    return "Account creation failed temporarily. Please try again.";
  }
  return "Sign-in failed temporarily. Please try again.";
}
