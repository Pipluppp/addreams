import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button, Card, Chip, Form, Input, Label, Spinner } from "@heroui/react";
import { authBaseUrl, authClient, useSession } from "../lib/auth-client";

type ProfileData = {
  user: { id: string; name: string; email: string; image: string | null };
  profile: {
    userId: string;
    accountType: "free" | "paid";
    creditsProductShoots: number;
    creditsAdGraphics: number;
  };
};

export default function ProfileRoute() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isSetup = searchParams.get("setup") === "true";
  const { data: session } = useSession();

  const {
    data: profileData,
    isPending,
    refetch,
  } = useQuery<ProfileData>({
    queryKey: ["me"],
    queryFn: async () => {
      const res = await fetch(`${authBaseUrl}/api/me`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load profile");
      return res.json();
    },
    enabled: !!session,
  });

  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profileData?.user.name) return;
    setName((current) => current || profileData.user.name);
  }, [profileData?.user.name]);

  async function handleUpdateName(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const result = await authClient.updateUser({ name: name.trim() });
      if (result.error) {
        setError(result.error.message ?? "Failed to update name.");
        return;
      }
      await refetch();
      if (isSetup) {
        navigate("/", { replace: true });
      }
    } catch {
      setError("Failed to update name. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSignOut() {
    await authClient.signOut();
    navigate("/", { replace: true });
  }

  if (isPending) {
    return (
      <section className="container-shell flex min-h-[60vh] items-center justify-center py-10">
        <Spinner size="lg" />
      </section>
    );
  }

  const user = profileData?.user;
  const profile = profileData?.profile;

  return (
    <section className="container-shell py-10">
      <div className="mx-auto max-w-lg space-y-6">
        <h1 className="section-title text-ink">
          {isSetup ? "Complete your profile" : "Your Profile"}
        </h1>

        {error && (
          <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>
        )}

        <Card className="space-y-5 px-6 py-6">
          <Form onSubmit={handleUpdateName} className="flex flex-col gap-4">
            <div className="flex w-full flex-col gap-1">
              <Label>Name</Label>
              <Input
                name="name"
                value={name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                placeholder="Your name"
                autoFocus={isSetup}
              />
            </div>
            <Button
              type="submit"
              variant="primary"
              isPending={saving}
              isDisabled={!name.trim() || name.trim() === user?.name}
            >
              {saving ? (
                <>
                  <Spinner color="current" size="sm" />
                  Saving...
                </>
              ) : isSetup ? (
                "Continue"
              ) : (
                "Update Name"
              )}
            </Button>
          </Form>
        </Card>

        {!isSetup && (
          <>
            <Card className="space-y-4 px-6 py-6">
              <h2 className="text-base font-semibold text-ink">Account Details</h2>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-ink-soft">Email</dt>
                  <dd className="text-ink">{user?.email}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-ink-soft">Account Type</dt>
                  <dd>
                    <Chip color={profile?.accountType === "paid" ? "accent" : undefined}>
                      {profile?.accountType ?? "free"}
                    </Chip>
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ink-soft">Product Shoots Credits</dt>
                  <dd className="text-ink">{profile?.creditsProductShoots ?? 0}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ink-soft">Ad Graphics Credits</dt>
                  <dd className="text-ink">{profile?.creditsAdGraphics ?? 0}</dd>
                </div>
              </dl>
            </Card>

            <Button variant="outline" onPress={handleSignOut} className="w-full">
              Sign Out
            </Button>
          </>
        )}
      </div>
    </section>
  );
}
