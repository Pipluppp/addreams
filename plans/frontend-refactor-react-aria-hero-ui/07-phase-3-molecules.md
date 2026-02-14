# Phase 3: Molecule Migrations

Update molecules to compose HeroUI primitives instead of custom atoms. Most molecules are thin wrappers — they become even thinner.

**Prerequisite:** Phase 2 complete (all atoms migrated)
**Strategy:** Update molecule internals to use new atom APIs. Some molecules may shrink to near-nothing.

---

## Step 3.1: GenerateButton → Button with isPending

**Ref:** [E9 in easy-refactorings.md](./03-easy-refactorings.md#e9-generatebutton--heroui-button-with-ispending)
**File:** `molecules/GenerateButton.tsx`

### Before

```tsx
import { PillButton } from "../atoms/PillButton";

export function GenerateButton({ label = "Generate", pendingLabel, isPending, disabled }) {
  return (
    <PillButton type="submit" disabled={disabled || isPending}>
      {isPending ? pendingLabel : label}
    </PillButton>
  );
}
```

### After

```tsx
import { Button } from "@heroui/react";

export function GenerateButton({
  label = "Generate",
  pendingLabel = "Generating...",
  isPending,
  disabled,
}: GenerateButtonProps) {
  return (
    <Button type="submit" variant="primary" isPending={isPending} isDisabled={disabled}>
      {isPending ? pendingLabel : label}
    </Button>
  );
}
```

**Decision:** Import HeroUI `Button` directly instead of going through `PillButton` wrapper. GenerateButton is always primary, always submit. No need for the tone abstraction.

---

## Step 3.2: PromptExtendToggle + WatermarkToggle → Switch wrappers

**Ref:** [E10 in easy-refactorings.md](./03-easy-refactorings.md#e10-promptextendtoggle--watermarktoggle--heroui-switch-wrappers)
**Files:** `molecules/PromptExtendToggle.tsx`, `molecules/WatermarkToggle.tsx`

These are already thin wrappers around ToggleField. Since ToggleField is now HeroUI Switch, these just pass through props:

### After (PromptExtendToggle)

```tsx
import { ToggleField } from "../atoms/ToggleField";

export function PromptExtendToggle({ id, checked, onChange }) {
  return (
    <ToggleField
      id={id}
      label="Prompt Extend"
      helperText="Allow the model to rewrite and extend your prompt."
      checked={checked}
      onChange={onChange}
    />
  );
}
```

No structural change — the atom handles the HeroUI Switch rendering. Same for WatermarkToggle.

---

## Step 3.3: SeedInput → TextField wrapper

**Ref:** [E11 in easy-refactorings.md](./03-easy-refactorings.md#e11-seedinput--heroui-textfield-or-numberfield)
**File:** `molecules/SeedInput.tsx`

### Before

```tsx
import { TextField } from "../atoms/TextField";

export function SeedInput({ id, value, onChange, error }) {
  return (
    <TextField id={id} label="Seed" value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder="Optional deterministic seed"
      inputMode="numeric" error={error}
      helperText="Integer from 0 to 2147483647. Leave empty for random seed."
    />
  );
}
```

### After

No structural change needed — TextField atom is already migrated to HeroUI internally. SeedInput just passes props through.

**Verify:** Helper text renders via HeroUI `Description`, error renders via `FieldError`.

---

## Step 3.4: SizePresetSelect + OutputFormatSelect → Select wrappers

**Ref:** [C5 in complex-refactorings.md](./04-complex-refactorings.md#c5-sizepresetselect--outputformatselect--heroui-select-wrappers)
**Files:** `molecules/SizePresetSelect.tsx`, `molecules/OutputFormatSelect.tsx`

### Key change

The `onChange` signature changed in Phase 2 (Step 2.6). Update the wrapper to match:

**Before:**
```tsx
<SelectField onChange={(event) => onChange(event.target.value)} ... />
```

**After:**
```tsx
<SelectField onChange={(value) => onChange(value)} ... />
```

### SizePresetSelect after

```tsx
import { QWEN_SIZE_PRESETS } from "../../features/parameters/constants";
import { SelectField } from "../atoms/SelectField";

const options = QWEN_SIZE_PRESETS.map((size) => ({ label: size, value: size }));

export function SizePresetSelect({ id, value, onChange, error, label = "Size", helperText, disabled }) {
  return (
    <SelectField
      id={id}
      label={label}
      value={value}
      onChange={onChange}   // now receives string directly
      options={options}
      helperText={helperText}
      error={error}
      isDisabled={disabled}
    />
  );
}
```

### OutputFormatSelect after

```tsx
import { OUTPUT_FORMATS } from "../../features/parameters/constants";
import { SelectField } from "../atoms/SelectField";

const options = OUTPUT_FORMATS.map((fmt) => ({
  label: fmt.toUpperCase(),
  value: fmt,
}));

export function OutputFormatSelect({ id, value, onChange, error }) {
  return (
    <SelectField
      id={id}
      label="Output Format"
      value={value}
      onChange={onChange}   // now receives string directly
      options={options}
      helperText="Use png or jpg output for generation."
      error={error}
    />
  );
}
```

---

## Step 3.5: PromptTextarea + NegativePromptTextarea + EditInstructionTextarea

**Ref:** [C4 in complex-refactorings.md](./04-complex-refactorings.md#c4-prompttextarea--heroui-textfield--textarea--character-counter)
**Files:** `molecules/PromptTextarea.tsx`, `molecules/NegativePromptTextarea.tsx`, `molecules/EditInstructionTextarea.tsx`

### PromptTextarea after

```tsx
import { TextField, Label, TextArea, FieldError } from "@heroui/react";
import { MAX_PROMPT_LENGTH } from "../../features/parameters/constants";
import { cn } from "../../lib/cn";

const SOFT_WARNING_THRESHOLD = 420;

export function PromptTextarea({ id, value, onChange, error, label = "Prompt" }) {
  const length = value.length;
  const warning = length >= SOFT_WARNING_THRESHOLD;

  return (
    <TextField isInvalid={Boolean(error)} validationErrors={error ? [error] : undefined}>
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
        <span className={cn("text-xs tabular-nums", warning ? "text-warning" : "text-ink-muted")}>
          {length}/{MAX_PROMPT_LENGTH}
        </span>
      </div>
    </TextField>
  );
}
```

### NegativePromptTextarea after

Same pattern, different constants:

```tsx
import { TextField, Label, TextArea, FieldError } from "@heroui/react";
import { MAX_NEGATIVE_PROMPT_LENGTH } from "../../features/parameters/constants";

export function NegativePromptTextarea({ id, value, onChange, error }) {
  return (
    <TextField isInvalid={Boolean(error)} validationErrors={error ? [error] : undefined}>
      <Label>Negative Prompt</Label>
      <TextArea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Describe what to avoid in the image..."
        rows={4}
        maxLength={MAX_NEGATIVE_PROMPT_LENGTH}
      />
      <div className="flex items-center justify-between gap-2">
        <FieldError>{error}</FieldError>
        <span className="text-xs tabular-nums text-ink-muted">
          {value.length}/{MAX_NEGATIVE_PROMPT_LENGTH}
        </span>
      </div>
    </TextField>
  );
}
```

### EditInstructionTextarea

Just wraps PromptTextarea with a different label — no change needed:

```tsx
export function EditInstructionTextarea({ id, value, onChange, error }) {
  return <PromptTextarea id={id} value={value} onChange={onChange} error={error} label="Edit Instruction" />;
}
```

---

## Step 3.6: WorkflowTabs → HeroUI Tabs with React Router

**Ref:** [C2 in complex-refactorings.md](./04-complex-refactorings.md#c2-workflowtabs--heroui-tabs-with-react-router)
**File:** `molecules/WorkflowTabs.tsx`

### After

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
      {tabs.map((tab) => (
        <Tabs.Panel key={tab.id} id={tab.id} className="sr-only">
          {tab.label} route panel
        </Tabs.Panel>
      ))}
    </Tabs>
  );
}
```

**Gains:** Arrow key navigation between tabs, proper ARIA roles, focus management.

**Consideration:** Route content still comes from `<Outlet />`; panels above are semantic placeholders.

---

## Step 3.7: ReferenceImageInputTabs → HeroUI Tabs (controlled)

**Ref:** [C3 in complex-refactorings.md](./04-complex-refactorings.md#c3-referenceimageinputtabs--heroui-tabs-controlled)
**File:** `molecules/ReferenceImageInputTabs.tsx`

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

---

## Step 3.8: ImageDropzone → Surface + Button

**Ref:** [C6 in complex-refactorings.md](./04-complex-refactorings.md#c6-imagedropzone--custom-with-heroui-surface--button)
**File:** `molecules/ImageDropzone.tsx`

Replace `SquircleSurface` with `Surface` (or just a `div` with `rounded-lg`), and inner button with HeroUI `Button`.

No structural change to drag-drop logic.

---

## Step 3.9: ImagePreviewCard → Card + Button

**Ref:** [E13 in easy-refactorings.md](./03-easy-refactorings.md#e13-imagepreviewcard--heroui-card--button)
**File:** `molecules/ImagePreviewCard.tsx`

Replace `Frame` with `Card`, `PillButton` with HeroUI `Button`.

---

## Step 3.10: ValidationSummary → Card with list

**Ref:** [E12 in easy-refactorings.md](./03-easy-refactorings.md#e12-validationsummary--heroui-card-with-list)
**File:** `molecules/ValidationSummary.tsx`

Replace `Frame` with `Card`. Structure unchanged.

---

## Step 3.11: ProgressStepper → Updated styling

**Ref:** [C7 in complex-refactorings.md](./04-complex-refactorings.md#c7-progressstepper--custom-with-heroui-aligned-styling)
**File:** `molecules/ProgressStepper.tsx`

Replace all `SquircleSurface` wrappers with `rounded-*` classes. Keep custom structure. No HeroUI component needed — this is the one truly custom UI piece.

---

## Step 3.12: ResultMetadataChips → Chip loop

**File:** `molecules/ResultMetadataChips.tsx`

No structural change needed — MetadataChip (now HeroUI Chip wrapper) handles rendering.

---

## Step 3.13: RouteLoadingFrame → Skeleton

**File:** `molecules/RouteLoadingFrame.tsx`

Replace `FrameCanvas` usage — already migrated to Skeleton in Phase 2.

---

## Step 3.14: StepHeader — No change

**File:** `molecules/StepHeader.tsx`

Pure semantic HTML. No HeroUI component needed. No migration required.

---

## Phase 3 Checklist

- [ ] 3.1 — GenerateButton → Button with isPending
- [ ] 3.2 — PromptExtendToggle + WatermarkToggle → Switch wrappers
- [ ] 3.3 — SeedInput → TextField wrapper (verify props pass through)
- [ ] 3.4 — SizePresetSelect + OutputFormatSelect → Select wrappers (onChange signature)
- [ ] 3.5 — PromptTextarea + NegativePromptTextarea + EditInstructionTextarea → TextField + TextArea
- [ ] 3.6 — WorkflowTabs → HeroUI Tabs with React Router
- [ ] 3.7 — ReferenceImageInputTabs → HeroUI Tabs (controlled)
- [ ] 3.8 — ImageDropzone → Surface + Button internals
- [ ] 3.9 — ImagePreviewCard → Card + Button
- [ ] 3.10 — ValidationSummary → Card with list
- [ ] 3.11 — ProgressStepper → rounded-* classes (remove SquircleSurface refs)
- [ ] 3.12 — ResultMetadataChips → verify Chip rendering
- [ ] 3.13 — RouteLoadingFrame → verify Skeleton rendering
- [ ] 3.14 — StepHeader → no change

### After each step

1. `npm run typecheck` — passes
2. `npm run dev` — visual verification of affected workflow
3. Test both Product Shoots and Ad Graphics forms end-to-end

**Next:** [Phase 4 — Organism Migrations](./08-phase-4-organisms.md)
