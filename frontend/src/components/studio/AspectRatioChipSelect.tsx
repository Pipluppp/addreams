import { Label, ListBox, Select } from "@heroui/react";
import { cn } from "../../lib/cn";

type AspectRatioOption = {
  id: string;
  label: string;
};

type AspectRatioChipSelectProps = {
  value: string;
  options: AspectRatioOption[];
  onChange: (value: string) => void;
  isDisabled?: boolean;
  className?: string;
};

function getAspectShapeClass(id: string): string {
  if (id === "story") return "h-[16px] w-[9px]";
  if (id === "feed") return "h-[14px] w-[11px]";
  return "size-[13px]";
}

function AspectShape({ id }: { id: string }) {
  return (
    <span className="inline-grid size-5 shrink-0 place-items-center rounded-md border border-studio-border bg-studio-surface-alt" aria-hidden="true">
      <span className={cn("rounded-[3px] border border-studio-border bg-studio-surface", getAspectShapeClass(id))} />
    </span>
  );
}

export function AspectRatioChipSelect({
  value,
  options,
  onChange,
  isDisabled,
  className,
}: AspectRatioChipSelectProps) {
  const selectedOption = options.find((option) => option.id === value);

  return (
    <Select
      value={value}
      onChange={(nextValue) => {
        if (typeof nextValue === "string") {
          onChange(nextValue);
        }
      }}
      isDisabled={isDisabled}
      variant="secondary"
      className={cn("w-full sm:w-[250px]", className)}
      placeholder="Select ratio"
    >
      <Label className="text-xs font-semibold text-studio-text">Aspect ratio</Label>
      <Select.Trigger className="h-10 min-h-10 rounded-full border border-studio-border bg-studio-surface px-3 py-2 text-studio-text shadow-none">
        <Select.Value>
          {({ defaultChildren, isPlaceholder }) => {
            if (isPlaceholder || !selectedOption) {
              return defaultChildren;
            }

            return (
              <span className="inline-flex min-h-5 items-center gap-2">
                <AspectShape id={selectedOption.id} />
                <span>{selectedOption.label}</span>
              </span>
            );
          }}
        </Select.Value>
        <Select.Indicator className="text-studio-text-muted" />
      </Select.Trigger>
      <Select.Popover className="rounded-2xl border border-studio-border bg-studio-surface p-1">
        <ListBox>
          {options.map((option) => (
            <ListBox.Item
              key={option.id}
              id={option.id}
              textValue={option.label}
              className="rounded-xl px-2 py-2 text-studio-text"
            >
              <span className="inline-flex items-center gap-2">
                <AspectShape id={option.id} />
                <span>{option.label}</span>
              </span>
              <ListBox.ItemIndicator />
            </ListBox.Item>
          ))}
        </ListBox>
      </Select.Popover>
    </Select>
  );
}
