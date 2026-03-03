import { StudioEntrySplitCardGrid } from "../../studio/StudioEntrySplitCardGrid";

type ProductShootsEntryCardsProps = {
  onStartGuided: () => void;
  onStartFlexible: () => void;
};

export function ProductShootsEntryCards({
  onStartGuided,
  onStartFlexible,
}: ProductShootsEntryCardsProps) {
  return (
    <StudioEntrySplitCardGrid
      cards={[
        {
          id: "guided",
          badge: "Guided",
          emphasized: true,
          illustration: {
            label: "Product Shoots",
            gradientFrom: "#FFE8D9",
            gradientTo: "#DFECFF",
          },
          title: "Create product shoots",
          description:
            "Upload your product image, select templates, and generate polished campaign-ready variations.",
          actionLabel: "Start Guided Product Shoots",
          onPress: onStartGuided,
        },
        {
          id: "freeform",
          badge: "Flexible",
          emphasized: false,
          illustration: {
            label: "Generate + Edit",
            gradientFrom: "#FFF3BF",
            gradientTo: "#F5F1EA",
          },
          title: "Generate or edit an image",
          description:
            "Open the flexible generate/edit workspace for prompt-driven image iteration.",
          actionLabel: "Open Generate/Edit",
          onPress: onStartFlexible,
        },
      ]}
    />
  );
}
