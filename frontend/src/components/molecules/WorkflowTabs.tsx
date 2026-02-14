import { Tabs } from "@heroui/react";
import { useLocation, useNavigate } from "react-router-dom";

type WorkflowTabsProps = {
  className?: string;
};

const tabs = [
  { id: "/product-shoots", label: "Product Shoots" },
  { id: "/ad-graphics", label: "Ad Graphics" },
];
const DEFAULT_WORKFLOW_TAB = "/product-shoots";

export function WorkflowTabs({ className }: WorkflowTabsProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const selectedKey =
    tabs.find((tab) => location.pathname.startsWith(tab.id))?.id ?? DEFAULT_WORKFLOW_TAB;

  return (
    <Tabs
      selectedKey={selectedKey}
      onSelectionChange={(key) => navigate(String(key))}
      className={className}
      aria-label="Workflow routes"
      hideSeparator
    >
      <Tabs.ListContainer>
        <Tabs.List aria-label="Workflow routes">
          {tabs.map((tab) => (
            <Tabs.Tab key={tab.id} id={tab.id}>
              {tab.label}
              <Tabs.Indicator />
            </Tabs.Tab>
          ))}
        </Tabs.List>
      </Tabs.ListContainer>
      {tabs.map((tab) => (
        <Tabs.Panel key={tab.id} id={tab.id} className="sr-only">
          {tab.label} route panel
        </Tabs.Panel>
      ))}
    </Tabs>
  );
}
