import { Outlet } from "react-router-dom";
import { SectionShell } from "../atoms/SectionShell";
import { WorkflowTabs } from "../molecules/WorkflowTabs";

export function StudioLayout() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 sm:px-6 sm:py-10">
      <SectionShell
        eyebrow="Studio"
        heading="Craft Product and Ad Visuals"
        description="Tune Qwen-ready parameters, run against the stub backend, and keep request settings reusable across sessions."
      >
        <WorkflowTabs />
      </SectionShell>
      <Outlet />
    </div>
  );
}
