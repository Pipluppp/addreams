import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ScopeProvider } from "bunshi/react";
import { Provider as JotaiProvider } from "jotai";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { ApiBaseScope } from "./lib/dependencies";
import "./index.css";

if (import.meta.env.DEV) {
  void import("react-grab").catch((error) => {
    console.warn("React Grab failed to load in development mode.", error);
  });
}

const queryClient = new QueryClient({
  defaultOptions: {
    mutations: {
      retry: 0,
    },
    queries: {
      retry: 1,
      staleTime: 60_000,
    },
  },
});

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "/api";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ScopeProvider scope={ApiBaseScope} value={apiBaseUrl}>
      <JotaiProvider>
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      </JotaiProvider>
    </ScopeProvider>
  </StrictMode>,
);
