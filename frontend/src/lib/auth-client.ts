import { createAuthClient } from "better-auth/react";
import { resolveRuntimeConfig } from "./runtime-config";

export const authBaseUrl = resolveRuntimeConfig().authBaseUrl;

export const authClient = createAuthClient({
  baseURL: authBaseUrl,
});

export const { useSession, signOut } = authClient;
