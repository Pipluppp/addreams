import { NavLink } from "react-router-dom";
import { cn } from "../../lib/cn";

type WorkflowTabsProps = {
  className?: string;
};

const tabs = [
  { label: "Product Shoots", to: "/studio/product-shoots" },
  { label: "Ad Graphics", to: "/studio/ad-graphics" },
];

export function WorkflowTabs({ className }: WorkflowTabsProps) {
  return (
    <div
      className={cn("flex flex-wrap gap-2", className)}
      role="tablist"
      aria-label="Studio workflows"
    >
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          className={({ isActive }) =>
            cn(
              "border px-4 py-2 text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-frame focus-visible:ring-offset-2 focus-visible:ring-offset-canvas",
              isActive
                ? "rounded-pill border-accent bg-accent text-accent-ink"
                : "border-frame bg-surface text-ink hover:border-accent",
            )
          }
          role="tab"
        >
          {tab.label}
        </NavLink>
      ))}
    </div>
  );
}
