import { authBaseUrl } from "./auth-client";

export type MeResponse = {
  user: { id: string; name: string; email: string; image: string | null };
  profile: {
    userId: string;
    accountType: "free" | "paid";
    creditsProductShoots: number;
    creditsAdGraphics: number;
  };
};

export const meQueryKey = ["me"] as const;

export async function fetchMe(): Promise<MeResponse> {
  const response = await fetch(`${authBaseUrl}/api/me`, { credentials: "include" });
  if (!response.ok) {
    throw new Error("Failed to load profile");
  }
  return (await response.json()) as MeResponse;
}
