import { Button, Modal } from "@heroui/react";
import { X } from "lucide-react";
import type { ProductShootsTemplate } from "../../../features/product-shoots/templates";
import { SelectionCounterChip } from "../../studio/SelectionCounterChip";
import { TemplateTile } from "../../studio/TemplateTile";

type TemplateSection = {
  category: string;
  items: ProductShootsTemplate[];
};

type TemplatePickerPanelProps = {
  isOpen: boolean;
  onOpenChange: (next: boolean) => void;
  sections: TemplateSection[];
  selectedTemplateIds: string[];
  maxTemplateCount: number;
  onToggleTemplate: (templateId: string) => void;
  onDone: () => void;
};

export function TemplatePickerPanel({
  isOpen,
  onOpenChange,
  sections,
  selectedTemplateIds,
  maxTemplateCount,
  onToggleTemplate,
  onDone,
}: TemplatePickerPanelProps) {
  const selectedCount = selectedTemplateIds.length;
  const isAtCap = selectedCount >= maxTemplateCount;

  return (
    <Modal.Backdrop
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      variant="blur"
      className="bg-black/32 backdrop-blur-md"
    >
      <Modal.Container size="full" placement="center" className="items-center justify-center p-4 sm:p-6">
        <Modal.Dialog className="h-[min(90vh,920px)] w-[min(1320px,96vw)] max-w-none rounded-3xl border border-studio-border bg-studio-surface p-0">
          <div className="flex h-full min-h-0 flex-col">
            <header className="flex items-center justify-between gap-3 border-b border-studio-border px-5 py-4">
              <div>
                <p className="accent-type text-[10px] uppercase tracking-[0.16em] text-studio-text-muted">
                  PS-TEMPLATE-PICKER
                </p>
                <h3 className="ui-title text-studio-text">Product shoot templates</h3>
              </div>
              <div className="flex items-center gap-2">
                <SelectionCounterChip selectedCount={selectedCount} maxCount={maxTemplateCount} />
                <Modal.CloseTrigger
                  aria-label="Close template picker"
                  className="rounded-xl border border-studio-border bg-studio-surface text-studio-text hover:bg-studio-surface-alt"
                >
                  <X className="size-6" aria-hidden="true" />
                </Modal.CloseTrigger>
              </div>
            </header>

            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-4">
              {sections.map((section) => (
                <section key={section.category} className="space-y-3">
                  <h4 className="text-sm font-semibold text-studio-text">{section.category}</h4>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {section.items.map((template) => {
                      const isSelected = selectedTemplateIds.includes(template.id);
                      const isDisabled = isAtCap && !isSelected;

                      return (
                        <TemplateTile
                          key={template.id}
                          id={template.id}
                          label={template.label}
                          summary={template.summary}
                          preview={template.preview}
                          isSelected={isSelected}
                          isDisabled={isDisabled}
                          onPress={onToggleTemplate}
                        />
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>

            <footer className="flex flex-wrap justify-end gap-2 border-t border-studio-border px-5 py-4">
              <Button type="button" variant="secondary" onPress={onDone}>
                Done
              </Button>
            </footer>
          </div>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
