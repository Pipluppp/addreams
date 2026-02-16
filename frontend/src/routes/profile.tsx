import { useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Alert, Button, Card, Chip, Skeleton } from "@heroui/react";
import { authClient, useSession } from "../lib/auth-client";
import { fetchMe, meQueryKey, type MeResponse } from "../lib/me";

export default function ProfileRoute() {
  const navigate = useNavigate();
  const { data: session, isPending: isSessionPending } = useSession();

  const { data: profileData, isPending } = useQuery<MeResponse>({
    queryKey: meQueryKey,
    queryFn: fetchMe,
    enabled: !!session,
  });

  const [error, setError] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    setError(null);
    try {
      await authClient.signOut();
      navigate("/", { replace: true });
    } catch (nextError) {
      setError(mapProfileError(nextError instanceof Error ? nextError.message : null));
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
            <Card.Title>Profile</Card.Title>
            <Card.Description>Manage account overview, credits, and active session controls.</Card.Description>
          </Card.Header>
          {user ? (
            <div className="space-y-1 text-xs text-ink-muted">
              {user.name ? (
                <p>
                  Name: <span className="font-semibold text-ink">{user.name}</span>
                </p>
              ) : null}
              <p>
                Email: <span className="font-semibold text-ink">{user.email}</span>
              </p>
            </div>
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
  return "Profile action failed. Please try again.";
}
