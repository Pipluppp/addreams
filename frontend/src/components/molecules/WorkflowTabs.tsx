import { NavLink, useLocation } from "react-router-dom";
import { cn } from "../../lib/cn";

type WorkflowTabsProps = {
  className?: string;
};

const tabs = [
  { to: "/product-shoots", label: "Product Shoots" },
  { to: "/ad-graphics", label: "Ad Graphics" },
];
const DEFAULT_WORKFLOW_TAB = "/product-shoots";

export function WorkflowTabs({ className }: WorkflowTabsProps) {
  const location = useLocation();

  const activePath =
    tabs.find((tab) => location.pathname.startsWith(tab.to))?.to ?? DEFAULT_WORKFLOW_TAB;

  return (
    <nav className={cn("grid gap-2 sm:grid-cols-2", className)} aria-label="Workflow routes">
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          className="tabs__tab text-center"
          aria-current={activePath === tab.to ? "page" : undefined}
        >
          {tab.label}
        </NavLink>
      ))}
    </nav>
  );
}
