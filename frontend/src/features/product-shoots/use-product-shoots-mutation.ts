import { useMutation } from "@tanstack/react-query";
import { useMolecule } from "bunshi/react";
import { ApiClientMolecule } from "../../lib/dependencies";
import { buildProductShootsPayload, type ProductShootsGenerationValues } from "./payload";
import { validateProductShootsForm } from "./schema";

export function useProductShootsMutation() {
  const api = useMolecule(ApiClientMolecule);

  return useMutation({
    mutationFn: async (values: ProductShootsGenerationValues) => {
      const validation = validateProductShootsForm(values);
      if (!validation.isValid) {
        const firstError = Object.values(validation.errors).find(Boolean);
        throw new Error(firstError ?? "Please resolve validation errors before submitting.");
      }

      if (!values.referenceImageUrl.trim()) {
        throw new Error("Reference image is required.");
      }

      const payload = buildProductShootsPayload(values);
      const response = await api.submitProductShoots(payload);
      return { payload, response };
    },
  });
}
