import { NavLink } from "react-router-dom";
import { cn } from "../../lib/cn";
import { SquircleSurface } from "../atoms/SquircleSurface";

type WorkflowTabsProps = {
  className?: string;
};

const tabs = [
  { label: "Product Shoots", to: "/product-shoots" },
  { label: "Ad Graphics", to: "/ad-graphics" },
];

export function WorkflowTabs({ className }: WorkflowTabsProps) {
  return (
    <div
      className={cn("flex flex-wrap gap-2", className)}
      role="tablist"
      aria-label="Workflow routes"
    >
      {tabs.map((tab) => (
        <SquircleSurface key={tab.to} asChild radius="xl" smooth="lg">
          <NavLink
            to={tab.to}
            className={({ isActive }) =>
              cn(
                "px-4 py-2 text-sm font-medium transition-colors duration-200",
                isActive
                  ? "bg-accent-primary text-on-primary"
                  : "bg-surface text-ink-soft hover:bg-surface-alt hover:text-accent-primary",
              )
            }
            role="tab"
          >
            {tab.label}
          </NavLink>
        </SquircleSurface>
      ))}
    </div>
  );
}
