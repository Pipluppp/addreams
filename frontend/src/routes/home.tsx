import { lazy, Suspense } from "react";
import { Frame } from "../components/atoms/Frame";
import { LandingSection } from "../components/layouts/LandingSection";
import { LandingFooterCta } from "../components/organisms/LandingFooterCta";
import { LandingHero } from "../components/organisms/LandingHero";
import { LandingValueSection } from "../components/organisms/LandingValueSection";
import { LandingWorkflowSplit } from "../components/organisms/LandingWorkflowSplit";
import { RouteLoadingFrame } from "../components/molecules/RouteLoadingFrame";

const LandingProofSection = lazy(() =>
  import("../components/organisms/LandingProofSection").then((module) => ({
    default: module.LandingProofSection,
  })),
);

export default function HomeRoute() {
  return (
    <>
      <LandingHero />

      <LandingSection>
        <Frame className="mb-5 inline-block px-4 py-2">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
            Choose your path
          </p>
        </Frame>
        <LandingWorkflowSplit />
      </LandingSection>

      <LandingSection className="pt-0">
        <Frame className="mb-5 inline-block px-4 py-2">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
            Why Addreams
          </p>
        </Frame>
        <LandingValueSection />
      </LandingSection>

      <LandingSection className="pt-0">
        <Frame className="mb-5 inline-block px-4 py-2">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
            Visual proof
          </p>
        </Frame>
        <Suspense fallback={<RouteLoadingFrame label="Loading generation examples..." />}>
          <LandingProofSection />
        </Suspense>
      </LandingSection>

      <LandingSection className="pt-0">
        <LandingFooterCta />
      </LandingSection>
    </>
  );
}
