import { useState } from "react";
import { DemoGuideButton } from "./DemoGuideButton";
import { DemoGuideModal } from "../organisms/DemoGuideModal";

type DemoGuideConfig = {
  color: "orange" | "blue";
  variant: "product-shoot" | "ad-graphics";
};

type StepHeaderProps = {
  workflow: string;
  title: string;
  description: string;
  currentStep: number;
  totalSteps: number;
  demoGuide?: DemoGuideConfig;
};

export function StepHeader({
  workflow,
  title,
  description,
  currentStep,
  totalSteps,
  demoGuide,
}: StepHeaderProps) {
  const [demoOpen, setDemoOpen] = useState(false);

  return (
    <header className="space-y-3">
      <p className="accent-type text-xs uppercase tracking-[0.18em] text-ink-muted">{workflow}</p>
      <h1 className="section-title text-ink">{title}</h1>
      <p className="max-w-3xl text-sm text-ink-soft sm:text-base">{description}</p>
      <p className="text-xs font-medium text-ink-muted">
        Step {currentStep + 1} of {totalSteps}
      </p>
      {demoGuide ? (
        <>
          <DemoGuideButton color={demoGuide.color} onPress={() => setDemoOpen(true)} />
          <DemoGuideModal
            isOpen={demoOpen}
            onOpenChange={setDemoOpen}
            variant={demoGuide.variant}
          />
        </>
      ) : null}
    </header>
  );
}
