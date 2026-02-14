import { Outlet } from "react-router-dom";
import { Card } from "@heroui/react";
import { WorkflowTabs } from "../molecules/WorkflowTabs";

export function StudioLayout() {
  return (
    <div className="container-shell space-y-5 py-6 sm:py-8">
      <Card className="space-y-3 p-5">
        <p className="accent-type text-xs uppercase tracking-[0.18em] text-ink-muted">Studio</p>
        <h2 className="ui-title text-ink">Step-Based Creative Workflows</h2>
        <p className="max-w-3xl text-sm text-ink-soft">
          Navigate each workflow with gated validation, persistent drafts, and review-first
          generation controls.
        </p>
        <WorkflowTabs />
      </Card>
      <Outlet />
    </div>
  );
}
