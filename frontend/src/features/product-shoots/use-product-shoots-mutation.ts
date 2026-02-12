import { useMutation } from "@tanstack/react-query";
import { useMolecule } from "bunshi/react";
import { ApiClientMolecule } from "../../lib/dependencies";
import { buildProductShootsPayload } from "./payload";
import type { ProductShootsFormValues } from "./schema";
import { parseSeedInput, validateProductShootsForm } from "./schema";

export function useProductShootsMutation() {
  const api = useMolecule(ApiClientMolecule);

  return useMutation({
    mutationFn: async (values: ProductShootsFormValues) => {
      const validation = validateProductShootsForm(values);
      if (!validation.isValid) {
        throw new Error("Please resolve validation errors before submitting.");
      }

      const seed = parseSeedInput(values.seed);
      const payload = buildProductShootsPayload(values, seed);
      const response = await api.submitProductShoots(payload);
      return { payload, response };
    },
  });
}
