import { resolveRuntimeConfig } from "./runtime-config";

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
  const apiBaseUrl = resolveRuntimeConfig().apiBaseUrl;
  const response = await fetch(`${apiBaseUrl}/me`, { credentials: "include" });
  if (!response.ok) {
    throw new Error("Failed to load profile");
  }
  return (await response.json()) as MeResponse;
}
