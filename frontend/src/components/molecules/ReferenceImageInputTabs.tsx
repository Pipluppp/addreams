import { Tabs } from "@heroui/react";
import type { ReferenceMode } from "../../features/ad-graphics/schema";

type ReferenceImageInputTabsProps = {
  value: ReferenceMode;
  onChange: (mode: ReferenceMode) => void;
};

export function ReferenceImageInputTabs({ value, onChange }: ReferenceImageInputTabsProps) {
  return (
    <Tabs
      selectedKey={value}
      onSelectionChange={(key) => onChange(String(key) as ReferenceMode)}
      className="w-full"
    >
      <Tabs.ListContainer>
        <Tabs.List aria-label="Reference image source" className="flex w-full gap-2">
          <Tabs.Tab
            id="upload"
            className="tabs__tab flex-1"
          >
            Upload
          </Tabs.Tab>
          <Tabs.Tab
            id="url"
            className="tabs__tab flex-1"
          >
            URL
          </Tabs.Tab>
        </Tabs.List>
      </Tabs.ListContainer>
      <Tabs.Panel id="upload" className="sr-only">
        Upload mode panel
      </Tabs.Panel>
      <Tabs.Panel id="url" className="sr-only">
        URL mode panel
      </Tabs.Panel>
    </Tabs>
  );
}
