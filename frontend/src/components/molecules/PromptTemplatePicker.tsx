import { Chip, Disclosure } from "@heroui/react";
import { cn } from "../../lib/cn";
import {
  getTemplateCategories,
  getTemplatesByCategory,
  type PromptTemplate,
} from "../../features/ad-graphics/prompt-templates";

type TemplateSelections = Record<string, string | null>;

type PromptTemplatePickerProps = {
  templates: readonly PromptTemplate[];
  selections: TemplateSelections;
  onSelectionsChange: (next: TemplateSelections) => void;
  isExpanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
};

export function PromptTemplatePicker({
  selections,
  onSelectionsChange,
  isExpanded,
  onExpandedChange,
}: PromptTemplatePickerProps) {
  const categories = getTemplateCategories();
  const selectionCount = Object.values(selections).filter(Boolean).length;

  function handleToggle(template: PromptTemplate) {
    const current = selections[template.category];
    onSelectionsChange({
      ...selections,
      [template.category]: current === template.id ? null : template.id,
    });
  }

  return (
    <Disclosure isExpanded={isExpanded} onExpandedChange={onExpandedChange}>
      <Disclosure.Heading>
        <Disclosure.Trigger className="flex w-full cursor-pointer items-center gap-2 text-xs font-medium text-ink-soft hover:text-ink">
          <Disclosure.Indicator />
          Prompt templates
          {selectionCount > 0 ? (
            <span className="text-[10px] text-ink-muted">
              ({selectionCount} selected)
            </span>
          ) : null}
        </Disclosure.Trigger>
      </Disclosure.Heading>
      <Disclosure.Content>
        <Disclosure.Body className="space-y-3 pt-2">
          <p className="text-[10px] text-ink-muted">
            Pick one per category. Selections are combined into your shoot direction.
          </p>
          {categories.map((category) => (
            <div key={category} className="space-y-1.5">
              <p className="text-[10px] font-medium uppercase tracking-wider text-ink-muted">
                {category}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {getTemplatesByCategory(category).map((template) => {
                  const isSelected = selections[template.category] === template.id;
                  return (
                    <Chip
                      key={template.id}
                      className={cn(
                        "cursor-pointer text-xs transition-colors",
                        isSelected
                          ? "!bg-accent-primary !text-on-primary ring-2 ring-accent-primary/30"
                          : "hover:bg-surface-alt",
                      )}
                      onClick={() => handleToggle(template)}
                    >
                      {template.label}
                    </Chip>
                  );
                })}
              </div>
            </div>
          ))}
        </Disclosure.Body>
      </Disclosure.Content>
    </Disclosure>
  );
}

export function composePromptFromSelections(
  presetBase: string,
  selections: TemplateSelections,
  allTemplates: readonly PromptTemplate[],
): string {
  const parts: string[] = [];

  if (presetBase) {
    parts.push(presetBase);
  }

  for (const template of allTemplates) {
    if (selections[template.category] === template.id) {
      parts.push(template.text);
    }
  }

  return parts.join(". ");
}

export type { TemplateSelections };
