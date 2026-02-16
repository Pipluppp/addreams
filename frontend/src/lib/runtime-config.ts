type RuntimeMode = "explicit-env" | "workers-dev-inferred" | "same-origin-proxy";

type RuntimeConfig = {
  authBaseUrl: string;
  apiBaseUrl: string;
  mode: RuntimeMode;
  isWorkersInference: boolean;
};

function inferWorkersApiOrigin(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  const { hostname, protocol } = window.location;
  if (!hostname.startsWith("addreams-web.") || !hostname.endsWith(".workers.dev")) {
    return null;
  }

  return `${protocol}//${hostname.replace(/^addreams-web\./, "addreams-api.")}`;
}

export function resolveRuntimeConfig(): RuntimeConfig {
  const explicitAuth = import.meta.env.VITE_AUTH_BASE_URL?.trim();
  const explicitApi = import.meta.env.VITE_API_BASE_URL?.trim();
  const inferredApiOrigin = inferWorkersApiOrigin();

  if (explicitAuth || explicitApi) {
    return {
      authBaseUrl: explicitAuth ?? "",
      apiBaseUrl: explicitApi ?? "/api",
      mode: "explicit-env",
      isWorkersInference: false,
    };
  }

  if (inferredApiOrigin) {
    return {
      authBaseUrl: inferredApiOrigin,
      apiBaseUrl: `${inferredApiOrigin}/api`,
      mode: "workers-dev-inferred",
      isWorkersInference: true,
    };
  }

  return {
    authBaseUrl: "",
    apiBaseUrl: "/api",
    mode: "same-origin-proxy",
    isWorkersInference: false,
  };
}
