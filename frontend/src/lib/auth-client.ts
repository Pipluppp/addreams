import { createAuthClient } from "better-auth/react";

function inferWorkersAuthBaseUrl(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  const { hostname, protocol } = window.location;
  if (!hostname.startsWith("addreams-web.") || !hostname.endsWith(".workers.dev")) {
    return null;
  }

  return `${protocol}//${hostname.replace(/^addreams-web\./, "addreams-api.")}`;
}

export const authBaseUrl = import.meta.env.VITE_AUTH_BASE_URL ?? inferWorkersAuthBaseUrl() ?? "";

export const authClient = createAuthClient({
  baseURL: authBaseUrl,
});

export const { useSession, signOut } = authClient;
