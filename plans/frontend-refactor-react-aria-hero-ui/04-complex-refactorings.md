# Complex Refactorings

These components require structural changes, HeroUI pattern adaptation, or careful mapping to preserve behavior while aligning with React Aria conventions.

---

## C1. SelectField → HeroUI Select (compound component)

**File:** `atoms/SelectField.tsx`
**Difficulty:** Medium
**Reason:** Native `<select>` becomes a compound component with trigger, popover, and listbox.

### Current

```tsx
export function SelectField({ id, label, options, helperText, error, ...props }) {
  return (
    <label htmlFor={id} className="flex flex-col gap-2 text-sm text-ink">
      <span className="font-medium text-ink-soft">{label}</span>
      <SquircleSurface asChild radius="lg" smooth="md">
        <select id={id} className="w-full bg-surface px-3 py-2.5 ..." {...props}>
          {options.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
      </SquircleSurface>
      {helperText && <span ...>{helperText}</span>}
      {error && <span ... aria-live="polite">{error}</span>}
    </label>
  );
}
```

### Challenges

1. **API change:** Native `<select>` uses `onChange` with `event.target.value`. HeroUI Select uses `value` + `onChange(value)` where value type is `Key | Key[] | null`.
2. **Options format:** Current `{label, value}[]` needs mapping to HeroUI's `<ListBox>` item collection.
3. **All consumers** (`SizePresetSelect`, `OutputFormatSelect`, `AdGraphicsPanel`) need their `onChange` handlers updated.

### After

```tsx
import { Select, Label, Description, FieldError, ListBox } from "@heroui/react";
import type { Key } from "@heroui/react";

type SelectOption = { label: string; value: string };

type SelectFieldProps = {
  id: string;
  label: string;
  options: SelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  helperText?: string;
  error?: string;
  isDisabled?: boolean;
  placeholder?: string;
};

export function SelectField({
  id,
  label,
  options,
  value,
  onChange,
  helperText,
  error,
  isDisabled,
  placeholder = "Select an option",
}: SelectFieldProps) {
  return (
    <Select
      value={value ?? null}
      onChange={(next) => {
        if (next == null || Array.isArray(next)) return;
        onChange?.(String(next as Key));
      }}
      isInvalid={Boolean(error)}
      isDisabled={isDisabled}
      placeholder={placeholder}
    >
      <Label>{label}</Label>
      <Select.Trigger>
        <Select.Value />
        <Select.Indicator />
      </Select.Trigger>
      <Select.Popover>
        <ListBox>
          {options.map((opt) => (
            <ListBox.Item key={opt.value} id={opt.value}>
              {opt.label}
            </ListBox.Item>
          ))}
        </ListBox>
      </Select.Popover>
      {helperText && <Description>{helperText}</Description>}
      <FieldError>{error}</FieldError>
    </Select>
  );
}
```

### Consumer migration

**SizePresetSelect** — before:
```tsx
<SelectField onChange={(event) => onChange(event.target.value)} ... />
```
After:
```tsx
<SelectField onChange={(value) => onChange(value)} ... />
```

Same pattern for `OutputFormatSelect`. The wrapper's `onChange` signature changes from `ChangeEvent<HTMLSelectElement>` to `(value: string) => void` — which is actually simpler.

### Visual parity

The HeroUI Select renders a custom trigger + popover dropdown instead of native `<select>`. Style the trigger via BEM `.select__trigger` to match current input styling (see `02-design-system-migration.md`). The popover gives a richer experience (keyboard search, sections, descriptions) — a DX upgrade.

---

## C2. WorkflowTabs → HeroUI Tabs (with React Router)

**File:** `molecules/WorkflowTabs.tsx`
**Difficulty:** Medium
**Reason:** Current implementation uses React Router `NavLink` for navigation + manual `role="tablist"` ARIA. HeroUI Tabs provides proper keyboard navigation but doesn't natively integrate with React Router.

### Current

```tsx
const tabs = [
  { label: "Product Shoots", to: "/product-shoots" },
  { label: "Ad Graphics", to: "/ad-graphics" },
];

export function WorkflowTabs({ className }) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)} role="tablist">
      {tabs.map((tab) => (
        <SquircleSurface key={tab.to} asChild radius="xl" smooth="lg">
          <NavLink to={tab.to}
            className={({ isActive }) => cn(
              "px-4 py-2 text-sm font-medium ...",
              isActive ? "bg-accent-primary text-on-primary" : "bg-surface text-ink-soft ..."
            )}
            role="tab"
          >{tab.label}</NavLink>
        </SquircleSurface>
      ))}
    </div>
  );
}
```

### Challenge

HeroUI `Tabs` manages tab state internally (selected key, panels, keyboard nav). But WorkflowTabs is **route-driven** — the "selected tab" is determined by the current URL path, and clicking a tab navigates to a route. There are two approaches:

### Approach A: HeroUI Tabs with router sync (recommended)

Use HeroUI Tabs in controlled mode, synced with React Router's location:

```tsx
import { Tabs } from "@heroui/react";
import { useNavigate, useLocation } from "react-router-dom";

const tabs = [
  { id: "/product-shoots", label: "Product Shoots" },
  { id: "/ad-graphics", label: "Ad Graphics" },
];

export function WorkflowTabs({ className }: { className?: string }) {
  const navigate = useNavigate();
  const location = useLocation();

  const selectedKey = tabs.find((t) => location.pathname.startsWith(t.id))?.id ?? tabs[0].id;

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
      {/* Render lightweight panels to preserve tab/panel semantics while route content lives in <Outlet /> */}
      {tabs.map((tab) => (
        <Tabs.Panel key={tab.id} id={tab.id} className="sr-only">
          {tab.label} route panel
        </Tabs.Panel>
      ))}
    </Tabs>
  );
}
```

### Gains
- Full keyboard navigation (arrow keys between tabs, Home/End)
- Proper ARIA tablist/tab/tabpanel association
- `[data-focus-visible]` styling
- No manual `role` attributes needed

### Considerations
- Route content still renders from `<Outlet />`; the tab panels above are semantic placeholders.
- If this feels too indirect, keep `WorkflowTabs` as a styled `NavLink` group with explicit roles instead of forcing Tabs.

---

## C3. ReferenceImageInputTabs → HeroUI Tabs (controlled)

**File:** `molecules/ReferenceImageInputTabs.tsx`
**Difficulty:** Medium
**Reason:** Same pattern as C2 but without routing — purely controlled state.

### Current

```tsx
export function ReferenceImageInputTabs({ value, onChange }) {
  const tabs = [
    { id: "upload", label: "Upload" },
    { id: "url", label: "URL" },
  ];
  return (
    <div className="flex w-full gap-2" role="tablist">
      {tabs.map((tab) => (
        <SquircleSurface key={tab.id} asChild radius="xl" smooth="lg">
          <button role="tab" aria-selected={value === tab.id}
            className={cn("flex-1 px-4 py-2 ...", value === tab.id ? "bg-accent-primary" : "bg-surface")}
            onClick={() => onChange(tab.id)}
          >{tab.label}</button>
        </SquircleSurface>
      ))}
    </div>
  );
}
```

### After

```tsx
import { Tabs } from "@heroui/react";
import type { ReferenceMode } from "../../features/ad-graphics/schema";
import type { Key } from "@heroui/react";

export function ReferenceImageInputTabs({ value, onChange }: {
  value: ReferenceMode;
  onChange: (mode: ReferenceMode) => void;
}) {
  return (
    <Tabs
      selectedKey={value}
      onSelectionChange={(key: Key) => onChange(key as ReferenceMode)}
      className="w-full"
      aria-label="Reference image source"
    >
      <Tabs.ListContainer>
        <Tabs.List aria-label="Reference image source" className="flex w-full gap-2">
          <Tabs.Tab id="upload" className="flex-1">
            Upload
            <Tabs.Indicator />
          </Tabs.Tab>
          <Tabs.Tab id="url" className="flex-1">
            URL
            <Tabs.Indicator />
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
```

### Gains
- Keyboard navigation between Upload/URL tabs
- Proper ARIA selected state management
- Focus management

---

## C4. PromptTextarea → HeroUI TextField + TextArea + character counter

**File:** `molecules/PromptTextarea.tsx`
**Difficulty:** Medium
**Reason:** Character count with soft warning threshold is custom logic that doesn't exist in HeroUI.

### Current

```tsx
export function PromptTextarea({ id, value, onChange, error, label = "Prompt" }) {
  const length = value.length;
  const warning = length >= SOFT_WARNING_THRESHOLD;
  return (
    <div className="space-y-2">
      <TextareaField id={id} label={label} value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Describe the product scene, style, and composition..."
        rows={5} error={error}
      />
      <p className={warning ? "text-xs text-warning" : "text-xs text-ink-muted"}>
        {length}/{MAX_PROMPT_LENGTH}
      </p>
    </div>
  );
}
```

### After

```tsx
import { TextField, Label, TextArea, Description, FieldError } from "@heroui/react";
import { MAX_PROMPT_LENGTH } from "../../features/parameters/constants";

const SOFT_WARNING_THRESHOLD = 420;

export function PromptTextarea({ id, value, onChange, error, label = "Prompt" }) {
  const length = value.length;
  const warning = length >= SOFT_WARNING_THRESHOLD;

  return (
    <TextField
      isInvalid={Boolean(error)}
      validationErrors={error ? [error] : undefined}
    >
      <Label>{label}</Label>
      <TextArea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Describe the product scene, style, and composition..."
        rows={5}
        maxLength={MAX_PROMPT_LENGTH}
      />
      <div className="flex items-center justify-between gap-2">
        <FieldError>{error}</FieldError>
        <span className={cn(
          "text-xs tabular-nums",
          warning ? "text-warning" : "text-ink-muted"
        )}>
          {length}/{MAX_PROMPT_LENGTH}
        </span>
      </div>
    </TextField>
  );
}
```

### Notes
- Character counter sits alongside FieldError in a flex row
- `maxLength` on TextArea prevents exceeding limit natively
- Same pattern applies to `NegativePromptTextarea` and `EditInstructionTextarea`

---

## C5. SizePresetSelect / OutputFormatSelect → HeroUI Select wrappers

**Files:** `molecules/SizePresetSelect.tsx`, `molecules/OutputFormatSelect.tsx`
**Difficulty:** Medium
**Reason:** Depends on C1 (SelectField refactor). Once SelectField is migrated, these become easy — but the `onChange` signature changes.

### Before

```tsx
export function SizePresetSelect({ id, value, onChange, ... }) {
  return (
    <SelectField id={id} label="Size" value={value}
      onChange={(event) => onChange(event.target.value)}
      options={options} ...
    />
  );
}
```

### After

```tsx
export function SizePresetSelect({ id, value, onChange, ... }) {
  return (
    <SelectField id={id} label="Size" value={value}
      onChange={(value) => onChange(value)}  // signature simplified
      options={options} ...
    />
  );
}
```

The key change is `onChange` now receives `string` directly instead of `ChangeEvent`. This also simplifies the organism-level handlers in `ProductShootsForm` and `AdGraphicsPanel`.

---

## C6. ImageDropzone → Custom with HeroUI Surface + Button

**File:** `molecules/ImageDropzone.tsx`
**Difficulty:** Medium
**Reason:** No HeroUI file dropzone component exists. Keep as custom but use HeroUI primitives internally.

### Current

Uses `SquircleSurface` for the drop zone container, a hidden `<input type="file">`, and a `SquircleSurface`-wrapped `<button>` for "Choose file".

### After

```tsx
import { useId, useRef, useState } from "react";
import { Button, Surface } from "@heroui/react";
import { cn } from "../../lib/cn";

export function ImageDropzone({ onFileSelected, error, buttonId }) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isActive, setIsActive] = useState(false);

  return (
    <div className="space-y-2">
      <input id={inputId} ref={inputRef} type="file" className="sr-only"
        accept="image/jpeg,image/png,image/bmp,image/webp,image/tiff,image/gif"
        onChange={(event) => {
          const next = event.target.files?.[0];
          if (next) onFileSelected(next);
          event.currentTarget.value = "";
        }}
      />
      <Surface
        className={cn(
          "flex min-h-40 flex-col items-center justify-center gap-2 rounded-lg px-4 py-6 text-center",
          isActive ? "bg-accent-highlight-soft" : "bg-surface-alt",
          error && "bg-[color-mix(in_srgb,var(--color-error)_8%,var(--color-surface-alt))]",
        )}
        onDragOver={(e) => { e.preventDefault(); setIsActive(true); }}
        onDragLeave={() => setIsActive(false)}
        onDrop={(e) => {
          e.preventDefault(); setIsActive(false);
          const next = e.dataTransfer.files?.[0];
          if (next) onFileSelected(next);
        }}
      >
        <p className="text-sm font-medium text-ink">Drop an image here</p>
        <p className="text-xs text-ink-muted">JPG, PNG, BMP, WEBP, TIFF, GIF up to 10MB</p>
        <Button id={buttonId} variant="ghost" size="sm"
          onPress={() => inputRef.current?.click()}
          className="mt-1 uppercase tracking-[0.08em]"
        >
          Choose file
        </Button>
      </Surface>
      {error && <p className="text-xs text-error">{error}</p>}
    </div>
  );
}
```

### What changes
- `SquircleSurface` → `Surface` + `rounded-lg` class
- Inner button → HeroUI `Button` with `variant="ghost"`
- Drag-drop logic, hidden file input, error display — all stay the same

---

## C7. ProgressStepper → Custom with HeroUI-aligned styling

**File:** `molecules/ProgressStepper.tsx`
**Difficulty:** Complex
**Reason:** No direct HeroUI stepper component. This is the most custom UI piece in the app — step cards with status badges, progress bar, responsive connectors.

### Analysis

The ProgressStepper has:
- A progress bar (hidden on mobile, shown on sm+)
- An ordered list of step buttons with status-dependent coloring
- Numbered badges per step
- Visual connectors between steps (vertical on mobile, horizontal on desktop)
- Click navigation with `canSelectStep` gating
- ARIA: `aria-current="step"`, `aria-disabled`, `aria-label`

### Approach: Keep custom, upgrade internals

This component is too specialized for any HeroUI primitive. The right approach is to **keep it custom** but:

1. Replace `SquircleSurface` with `rounded-*` classes + CSS `corner-shape`
2. Use HeroUI `Button` for the step button (gains `onPress`, `isDisabled`, focus management)
3. Keep the status logic (`lib/stepper.ts`) unchanged

### After (key changes only)

```tsx
import { Button } from "@heroui/react";
import type { StepStatus } from "../../lib/stepper";
import { cn } from "../../lib/cn";

export function ProgressStepper({ steps, statuses, currentStep, onStepSelect, canSelectStep }) {
  const progress = steps.length > 1
    ? `${Math.max(0, Math.min(100, (currentStep / (steps.length - 1)) * 100))}%`
    : "100%";

  return (
    <div className="space-y-3">
      {/* Progress bar */}
      <div className="hidden rounded-2xl bg-surface-alt p-1 sm:block">
        <div className="h-2 overflow-hidden rounded-2xl bg-surface">
          <div className="h-full bg-accent-primary transition-[width] duration-300"
            style={{ width: progress }} />
        </div>
      </div>

      {/* Step list */}
      <ol className="flex flex-col gap-2 md:flex-row md:gap-3" aria-label="Workflow steps">
        {steps.map((step, index) => {
          const status = statuses[index] ?? "not_started";
          const isCurrent = index === currentStep;
          const isClickable = canSelectStep(index);

          return (
            <li key={step.id} className="relative md:flex-1">
              <button
                type="button"
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left",
                  STEP_CARD_TONE[status],
                  isCurrent && "shadow-[0_0_0_1px_color-mix(in_srgb,var(--color-accent-primary)_35%,transparent)]",
                  !isClickable && "cursor-not-allowed opacity-80",
                )}
                onClick={() => isClickable && onStepSelect(index)}
                aria-current={isCurrent ? "step" : undefined}
                aria-disabled={!isClickable}
              >
                <span className={cn(
                  "inline-flex min-h-8 min-w-8 items-center justify-center rounded-lg px-2",
                  "accent-type text-[10px] uppercase tracking-[0.15em]",
                  STEP_BADGE_TONE[status],
                )}>
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <p className="accent-type text-[10px] uppercase tracking-[0.16em] text-ink-muted">
                    Step {index + 1}
                  </p>
                  <p className="line-clamp-1 text-sm font-medium text-ink">{step.label}</p>
                </div>
              </button>
              {/* Connectors unchanged */}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
```

### Key changes
- All `SquircleSurface` wrappers → `rounded-*` classes
- Step buttons keep native `<button>` (HeroUI Button could be used but adds unnecessary overhead for this heavily-styled custom element)
- CSS `corner-shape: squircle` applies automatically via global rule
- No structural change to the component

---

## C8. ProductShootsForm → Adopt HeroUI Disclosure for accordion

**File:** `organisms/ProductShootsForm.tsx`
**Difficulty:** Medium

### Current accordion pattern

```tsx
const [advancedOpen, setAdvancedOpen] = useState(false);

<button
  type="button"
  onClick={() => setAdvancedOpen((c) => !c)}
  aria-expanded={advancedOpen}
  aria-controls="product-advanced-options"
>
  Advanced options {advancedOpen ? "-" : "+"}
</button>

{advancedOpen ? (
  <div id="product-advanced-options" className="grid gap-4 md:grid-cols-2">
    {/* advanced fields */}
  </div>
) : null}
```

### After: HeroUI Disclosure

```tsx
import { Disclosure } from "@heroui/react";

<Disclosure>
  <Disclosure.Heading>
    <Disclosure.Trigger className="inline-flex items-center text-sm font-semibold uppercase tracking-[0.08em] text-ink hover:text-accent-primary">
      Advanced options
      <Disclosure.Indicator />
    </Disclosure.Trigger>
  </Disclosure.Heading>
  <Disclosure.Content>
    <Disclosure.Body className="grid gap-4 md:grid-cols-2">
      {/* advanced fields — unchanged */}
    </Disclosure.Body>
  </Disclosure.Content>
</Disclosure>
```

### Gains
- `aria-expanded` and `aria-controls` handled automatically
- Keyboard support (Enter/Space to toggle)
- Animation support via `[data-expanded]` CSS
- Remove `useState(false)` for `advancedOpen`

### Same pattern applies in AdGraphicsPanel
If AdGraphicsPanel has any collapsible sections, use the same Disclosure pattern.

---

## C9. AppShellLayout mobile nav → HeroUI Disclosure

**File:** `layouts/AppShellLayout.tsx`
**Difficulty:** Medium

### Current

```tsx
const [menuOpen, setMenuOpen] = useState(false);

<button onClick={() => setMenuOpen((c) => !c)} aria-label="Toggle navigation">
  Menu
</button>

{menuOpen ? (
  <nav className="mt-3 flex flex-col gap-2 pt-3 md:hidden">
    {navItems.map(...)}
  </nav>
) : null}
```

### After: HeroUI Disclosure

```tsx
import { Disclosure } from "@heroui/react";

<Disclosure className="md:hidden">
  <Disclosure.Heading>
    <Disclosure.Trigger className="..." aria-label="Toggle navigation">
      Menu
    </Disclosure.Trigger>
  </Disclosure.Heading>
  <Disclosure.Content>
    <Disclosure.Body>
      <nav className="mt-3 flex flex-col gap-2 pt-3">
        {navItems.map((item) => (
          <NavLink key={item.to} to={item.to} className={...}>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </Disclosure.Body>
  </Disclosure.Content>
</Disclosure>
```

### Consideration
When a NavLink is clicked, the menu should close. With Disclosure, use controlled mode:

```tsx
const [isExpanded, setIsExpanded] = useState(false);

<Disclosure isExpanded={isExpanded} onExpandedChange={setIsExpanded}>
  ...
  <NavLink ... onClick={() => setIsExpanded(false)}>
```

---

## Migration Order for Complex Refactorings

Must happen **after** all easy refactorings are done:

1. **C1** — SelectField (blocks C5)
2. **C5** — SizePresetSelect + OutputFormatSelect (depends on C1)
3. **C2** — WorkflowTabs (independent)
4. **C3** — ReferenceImageInputTabs (independent)
5. **C4** — PromptTextarea variants (independent)
6. **C6** — ImageDropzone (independent)
7. **C7** — ProgressStepper (independent)
8. **C8** — ProductShootsForm Disclosure (depends on all form field migrations)
9. **C9** — AppShellLayout nav (independent)
