import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Alert,
  Button,
  Card,
  FieldError,
  Form,
  Input,
  Label,
  Skeleton,
  Spinner,
  Tabs,
  TextField,
} from "@heroui/react";
import { authClient, useSession } from "../lib/auth-client";

type Mode = "sign-in" | "sign-up";

type FieldErrors = {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PIXEL_PATTERN = [
  "00111000011100",
  "01111110111110",
  "11110111101111",
  "11111111111111",
  "01111111111110",
  "00111111111100",
  "00011111111000",
  "00001111110000",
  "00000111100000",
  "00000011000000",
] as const;

export default function LoginRoute() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const rawRedirect = searchParams.get("redirect") ?? "/";
  const redirect = rawRedirect.startsWith("/") ? rawRedirect : "/";
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
      <section className="container-shell py-4 sm:py-6">
        <div className="shadow-soft-stack grid overflow-hidden rounded-[var(--radius-xl)] border border-border/70 bg-surface lg:grid-cols-[minmax(0,33rem)_1fr]">
          <div className="space-y-3 p-4 sm:p-6">
            <Skeleton className="h-6 w-2/5 rounded-md" />
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
          <div className="hidden min-h-[28rem] border-l border-border/70 bg-surface-alt lg:block" />
        </div>
      </section>
    );
  }

  return (
    <section className="container-shell py-4 sm:py-6">
      <div className="shadow-soft-stack grid overflow-hidden rounded-[var(--radius-xl)] border border-border/70 bg-surface lg:min-h-[calc(100vh-12.5rem)] lg:grid-cols-[minmax(0,33rem)_1fr]">
        <div className="flex items-center p-4 sm:p-6 lg:p-7">
          <Card variant="transparent" className="w-full space-y-4">
            <Card.Header>
              <Card.Title className="text-[1.75rem] leading-tight sm:text-[2rem]">
                {mode === "sign-in" ? "Sign in to addreams" : "Create your addreams account"}
              </Card.Title>
            </Card.Header>

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
                <Tabs.List
                  aria-label="Authentication mode"
                  className="w-full rounded-[var(--radius-md)] bg-surface-alt p-1 *:flex-1 *:rounded-[var(--radius-sm)]"
                >
                  <Tabs.Tab
                    id="sign-in"
                    className="font-semibold aria-[selected=true]:text-on-primary data-[selected=true]:text-on-primary"
                  >
                    Sign In
                  </Tabs.Tab>
                  <Tabs.Tab
                    id="sign-up"
                    className="font-semibold aria-[selected=true]:text-on-primary data-[selected=true]:text-on-primary"
                  >
                    Create Account
                  </Tabs.Tab>
                </Tabs.List>
              </Tabs.ListContainer>

              <Tabs.Panel id="sign-in" className="pt-4">
                <Form onSubmit={handleSubmit} className="space-y-3">
                  <AuthTextField
                    name="email"
                    type="email"
                    label="Email"
                    value={email}
                    onChange={(nextValue) => {
                      setEmail(nextValue);
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
                    onChange={(nextValue) => {
                      setPassword(nextValue);
                      setFieldErrors((current) => ({ ...current, password: undefined }));
                    }}
                    placeholder="Your password"
                    autoComplete="current-password"
                    error={fieldErrors.password}
                  />
                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full"
                    isDisabled={isSubmitDisabled}
                  >
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

              <Tabs.Panel id="sign-up" className="pt-4">
                <Form onSubmit={handleSubmit} className="space-y-3">
                  <AuthTextField
                    name="name"
                    type="text"
                    label="Name"
                    value={name}
                    onChange={(nextValue) => {
                      setName(nextValue);
                      setFieldErrors((current) => ({ ...current, name: undefined }));
                    }}
                    placeholder="Your full name"
                    autoComplete="name"
                    error={fieldErrors.name}
                  />
                  <AuthTextField
                    name="email"
                    type="email"
                    label="Email"
                    value={email}
                    onChange={(nextValue) => {
                      setEmail(nextValue);
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
                    onChange={(nextValue) => {
                      setPassword(nextValue);
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
                    onChange={(nextValue) => {
                      setConfirmPassword(nextValue);
                      setFieldErrors((current) => ({
                        ...current,
                        confirmPassword: undefined,
                      }));
                    }}
                    placeholder="Repeat your password"
                    autoComplete="new-password"
                    error={fieldErrors.confirmPassword}
                  />
                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full"
                    isDisabled={isSubmitDisabled}
                  >
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

            <Card
              variant="secondary"
              className="shadow-soft-stack relative overflow-hidden rounded-[var(--radius-lg)] border border-border/70 p-4 lg:hidden"
            >
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 18% 18%, color-mix(in srgb, var(--color-brand-gold) 36%, transparent), transparent 52%), radial-gradient(circle at 82% 24%, color-mix(in srgb, var(--color-brand-blue) 28%, transparent), transparent 56%), radial-gradient(circle at 76% 86%, color-mix(in srgb, var(--color-brand-orange) 24%, transparent), transparent 58%)",
                }}
              />
              <div className="relative space-y-2">
                <p className="accent-type text-[10px] uppercase tracking-[0.18em] text-ink-muted">
                  Protected Workflows
                </p>
                <p className="text-xs text-ink-soft">
                  Sign in to access Product Shoots, Ad Graphics, and generation history.
                </p>
              </div>
              <div className="shadow-soft-stack relative mx-auto mt-4 grid w-full max-w-[14rem] grid-cols-14 gap-0.5 rounded-[var(--radius-sm)] bg-surface p-3">
                {PIXEL_PATTERN.flatMap((row, rowIndex) =>
                  row.split("").map((pixel, colIndex) => (
                    <div
                      key={`mobile-${rowIndex}-${colIndex}`}
                      className="aspect-square rounded-[4px]"
                      style={{
                        background:
                          pixel === "1"
                            ? "color-mix(in srgb, var(--color-brand-orange) 78%, white)"
                            : "color-mix(in srgb, var(--color-brand-blue) 14%, transparent)",
                      }}
                    />
                  )),
                )}
              </div>
            </Card>
          </Card>
        </div>

        <aside className="relative hidden border-l border-border/70 bg-surface-alt p-6 lg:flex lg:flex-col lg:justify-between lg:p-7">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(circle at 18% 18%, color-mix(in srgb, var(--color-brand-gold) 36%, transparent), transparent 50%), radial-gradient(circle at 78% 24%, color-mix(in srgb, var(--color-brand-blue) 30%, transparent), transparent 56%), radial-gradient(circle at 78% 80%, color-mix(in srgb, var(--color-brand-orange) 26%, transparent), transparent 58%)",
            }}
          />
          <div className="relative space-y-3">
            <p className="accent-type text-xs uppercase tracking-[0.2em] text-ink-muted">
              Protected workspace
            </p>
            <h2 className="section-title max-w-[14ch] text-ink">
              Build ad visuals with a focused workflow.
            </h2>
          </div>

          <div className="shadow-soft-stack relative mx-auto mt-6 grid w-full max-w-[24rem] grid-cols-14 gap-1 rounded-[var(--radius-lg)] bg-surface p-4">
            {PIXEL_PATTERN.flatMap((row, rowIndex) =>
              row.split("").map((pixel, colIndex) => (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className="aspect-square rounded-[6px]"
                  style={{
                    background:
                      pixel === "1"
                        ? "color-mix(in srgb, var(--color-brand-orange) 78%, white)"
                        : "color-mix(in srgb, var(--color-brand-blue) 14%, transparent)",
                  }}
                />
              )),
            )}
          </div>
        </aside>
      </div>
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
  onChange: (nextValue: string) => void;
  placeholder: string;
  autoComplete?: string;
  error?: string;
}) {
  return (
    <TextField
      name={name}
      value={value}
      onChange={onChange}
      isInvalid={Boolean(error)}
      className="w-full gap-1.5"
      validationBehavior="aria"
    >
      <Label>{label}</Label>
      <Input type={type} placeholder={placeholder} autoComplete={autoComplete} />
      {error ? <FieldError>{error}</FieldError> : null}
    </TextField>
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
    return "Cannot reach the auth server. Verify auth/API base URLs and backend availability.";
  }
  if (normalized.includes("cookie") || normalized.includes("session")) {
    return "Your session cookie is missing or expired. Sign in again.";
  }
  if (mode === "sign-up") {
    return "Account creation failed temporarily. Please try again.";
  }
  return "Sign-in failed temporarily. Please try again.";
}
