import { useMutation } from "@tanstack/react-query";
import { useMolecule } from "bunshi/react";
import { ApiClientMolecule } from "../../lib/dependencies";
import { buildAdGraphicsPayload } from "./payload";
import type { AdGraphicsFormValues } from "./schema";
import { parseSeed, validateAdGraphicsForm } from "./schema";

export function useAdGraphicsMutation() {
  const api = useMolecule(ApiClientMolecule);

  return useMutation({
    mutationFn: async (values: AdGraphicsFormValues) => {
      const validation = validateAdGraphicsForm(values);
      if (!validation.isValid) {
        throw new Error("Please resolve validation errors before submitting.");
      }

      const seed = parseSeed(values.seed);
      const payload = await buildAdGraphicsPayload(values, seed);
      const response = await api.submitAdGraphics(payload);
      return { payload, response };
    },
  });
}
