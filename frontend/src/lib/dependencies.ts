import { createScope, molecule } from "bunshi";
import { createApiClient } from "./api";

export const ApiBaseScope = createScope("/api", { debugLabel: "ApiBaseUrl" });

export const ApiClientMolecule = molecule((_, scope) => {
  const baseUrl = scope(ApiBaseScope);
  return createApiClient(baseUrl);
});
