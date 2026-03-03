export type MeResponse = {
  user: { id: string; name: string; email: string; image: string | null };
  profile: {
    userId: string;
    accountType: "free" | "paid";
    creditsImageEdits: number;
  };
};

export const meQueryKey = ["me"] as const;

export async function fetchMe(): Promise<MeResponse> {
  const response = await fetch("/api/me", { credentials: "include" });
  if (!response.ok) {
    throw new Error("Failed to load profile");
  }
  return (await response.json()) as MeResponse;
}
