import { useEffect, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Alert, Button, Card, Chip, Form, Input, Label, Skeleton, Spinner } from "@heroui/react";
import { authClient, useSession } from "../lib/auth-client";
import { fetchMe, meQueryKey, type MeResponse } from "../lib/me";

export default function ProfileRoute() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isSetup = searchParams.get("setup") === "true";
  const { data: session, isPending: isSessionPending } = useSession();

  const { data: profileData, isPending, refetch } = useQuery<MeResponse>({
    queryKey: meQueryKey,
    queryFn: fetchMe,
    enabled: !!session,
  });

  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    if (!profileData?.user.name) return;
    setName((current) => current || profileData.user.name);
  }, [profileData?.user.name]);

  async function handleUpdateName(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setSaving(true);

    try {
      const result = await authClient.updateUser({ name: name.trim() });
      if (result.error) {
        setError(mapProfileError(result.error.message));
        return;
      }

      await refetch();
      if (isSetup) {
        navigate("/", { replace: true });
        return;
      }

      setSuccess("Profile updated.");
    } catch (error) {
      setError(mapProfileError(error instanceof Error ? error.message : null));
    } finally {
      setSaving(false);
    }
  }

  async function handleSignOut() {
    setSigningOut(true);
    setError(null);
    setSuccess(null);
    try {
      await authClient.signOut();
      navigate("/", { replace: true });
    } catch (error) {
      setError(mapProfileError(error instanceof Error ? error.message : null));
    } finally {
      setSigningOut(false);
    }
  }

  if (isSessionPending || isPending) {
    return (
      <section className="container-shell py-10">
        <div className="mx-auto grid max-w-4xl gap-4">
          <Card className="space-y-3 p-5">
            <Skeleton className="h-6 w-44 rounded-md" />
            <Skeleton className="h-4 w-72 rounded-md" />
          </Card>
          <Card className="grid gap-4 p-5 sm:grid-cols-3">
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
          </Card>
          <Card className="space-y-3 p-5">
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-10 w-36 rounded-xl" />
          </Card>
        </div>
      </section>
    );
  }

  const user = profileData?.user;
  const profile = profileData?.profile;

  return (
    <section className="container-shell py-8 sm:py-10">
      <div className="mx-auto max-w-4xl space-y-5">
        <Card className="space-y-3 p-5 sm:p-6">
          <Card.Header>
            <Card.Title>{isSetup ? "Complete your profile" : "Profile"}</Card.Title>
            <Card.Description>
              {isSetup
                ? "Set your display name to continue into generation workflows."
                : "Manage identity, credits, and active session controls."}
            </Card.Description>
          </Card.Header>
          {user ? (
            <p className="text-xs text-ink-muted">
              Signed in as <span className="font-semibold text-ink">{user.email}</span>
            </p>
          ) : null}
        </Card>

        {error ? (
          <Alert status="danger">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>Profile action failed</Alert.Title>
              <Alert.Description>{error}</Alert.Description>
            </Alert.Content>
          </Alert>
        ) : null}

        {success ? (
          <Alert status="success">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>Saved</Alert.Title>
              <Alert.Description>{success}</Alert.Description>
            </Alert.Content>
          </Alert>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-3">
          <SummaryCard title="Account Type">
            <Chip color={profile?.accountType === "paid" ? "accent" : "default"} variant="soft">
              {profile?.accountType ?? "free"}
            </Chip>
          </SummaryCard>
          <SummaryCard title="Product Shoots Credits">
            <p className="text-2xl font-semibold text-ink">{profile?.creditsProductShoots ?? 0}</p>
          </SummaryCard>
          <SummaryCard title="Ad Graphics Credits">
            <p className="text-2xl font-semibold text-ink">{profile?.creditsAdGraphics ?? 0}</p>
          </SummaryCard>
        </div>

        <Card className="space-y-4 p-5 sm:p-6">
          <Card.Header>
            <Card.Title className="text-base">Identity</Card.Title>
            <Card.Description>Update the display name used across the app.</Card.Description>
          </Card.Header>
          <Form onSubmit={handleUpdateName} className="space-y-4">
            <div className="flex w-full flex-col gap-1">
              <Label>Name</Label>
              <Input
                name="name"
                value={name}
                onChange={(event: ChangeEvent<HTMLInputElement>) => setName(event.target.value)}
                placeholder="Your name"
                autoFocus={isSetup}
              />
            </div>
            <Button
              type="submit"
              variant="primary"
              isDisabled={saving || !name.trim() || name.trim() === user?.name}
            >
              {saving ? (
                <>
                  <Spinner color="current" size="sm" />
                  Saving...
                </>
              ) : isSetup ? (
                "Continue"
              ) : (
                "Save Profile"
              )}
            </Button>
          </Form>
        </Card>

        <Card className="space-y-4 p-5 sm:p-6">
          <Card.Header>
            <Card.Title className="text-base">Session</Card.Title>
            <Card.Description>
              Sign out here if this browser should no longer access protected routes.
            </Card.Description>
          </Card.Header>
          <Button variant="outline" isPending={signingOut} onPress={handleSignOut}>
            {signingOut ? "Signing out..." : "Sign Out"}
          </Button>
        </Card>

        <Alert status="warning">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>Email verification status</Alert.Title>
            <Alert.Description>
              Email verification is currently disabled; account email ownership is not guaranteed yet.
            </Alert.Description>
          </Alert.Content>
        </Alert>
      </div>
    </section>
  );
}

function SummaryCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card className="space-y-2 p-4">
      <p className="text-xs uppercase tracking-[0.12em] text-ink-muted">{title}</p>
      {children}
    </Card>
  );
}

function mapProfileError(message: string | null | undefined): string {
  const normalized = message?.toLowerCase() ?? "";

  if (normalized.includes("session") || normalized.includes("cookie")) {
    return "Your session appears expired. Sign in again.";
  }
  if (normalized.includes("network") || normalized.includes("fetch")) {
    return "Could not reach the backend. Check your API/auth base URL configuration.";
  }
  if (normalized.includes("unauthorized")) {
    return "You are no longer authorized for this action. Sign in again.";
  }
  return "Profile update failed. Please try again.";
}
