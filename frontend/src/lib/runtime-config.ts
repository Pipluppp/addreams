type RuntimeMode = "explicit-env" | "same-origin-proxy";

type RuntimeConfig = {
  authBaseUrl: string;
  apiBaseUrl: string;
  mode: RuntimeMode;
};

export function resolveRuntimeConfig(): RuntimeConfig {
  const explicitAuth = import.meta.env.VITE_AUTH_BASE_URL?.trim();
  const explicitApi = import.meta.env.VITE_API_BASE_URL?.trim();

  if (explicitAuth || explicitApi) {
    return {
      authBaseUrl: explicitAuth ?? "",
      apiBaseUrl: explicitApi ?? "/api",
      mode: "explicit-env",
    };
  }

  return {
    authBaseUrl: "",
    apiBaseUrl: "/api",
    mode: "same-origin-proxy",
  };
}
