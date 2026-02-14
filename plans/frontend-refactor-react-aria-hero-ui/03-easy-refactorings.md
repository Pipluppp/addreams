# Easy Refactorings

These are straightforward 1:1 swaps where the current component maps directly to a HeroUI equivalent with minimal structural change. Each can be done as its own small PR.

---

## E1. SquircleSurface → CSS corner-shape (delete component)

**File:** `atoms/SquircleSurface.tsx`
**Effort:** Small
**Risk:** Low — visual-only change

### Current

```tsx
// SquircleSurface wraps children in @squircle-js Squircle component
<SquircleSurface asChild radius="lg" smooth="md">
  <input ... />
</SquircleSurface>
```

Every atom uses `SquircleSurface` as a wrapper. It adds a `<Squircle>` component from `@squircle-js/react` that applies SVG clip-path corners.

### After

Delete `SquircleSurface.tsx` entirely. Each consumer applies `rounded-{size}` Tailwind class directly. The global `@supports (corner-shape: squircle)` rule in `index.css` handles the smooth corners.

**Radius mapping for find-and-replace:**

| SquircleSurface `radius` | Tailwind Class | CSS Value |
|--------------------------|---------------|-----------|
| `"sm"` | `rounded-[12px]` or `rounded-sm` (custom) | 12px |
| `"md"` | `rounded-[18px]` or `rounded-md` (custom) | 18px |
| `"lg"` | `rounded-lg` (custom = 24px) | 24px |
| `"xl"` | `rounded-xl` (custom = 32px) | 32px |
| `"xxl"` | `rounded-2xl` (custom = 42px) | 42px |

**Prerequisite:** Phase 1 foundation (CSS corner-shape + radius tokens in index.css) must be done first.

---

## E2. PillButton → HeroUI Button

**File:** `atoms/PillButton.tsx`
**Effort:** Small
**Risk:** Low

### Current

```tsx
export function PillButton({ className, tone = "primary", asChild = false, ...props }) {
  const Component = asChild ? Slot : "button";
  return (
    <SquircleSurface asChild radius="xxl" smooth="xl">
      <Component className={cn(
        "inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold ...",
        tone === "primary" && "bg-accent-primary text-on-primary hover:bg-accent-primary-hover",
        tone === "secondary" && "bg-accent-secondary text-on-secondary ...",
        tone === "neutral" && "bg-surface text-ink hover:bg-surface-alt ...",
        className,
      )} {...props} />
    </SquircleSurface>
  );
}
```

### After

```tsx
import { Button } from "@heroui/react";

type PillButtonProps = {
  tone?: "primary" | "secondary" | "neutral";
  children: React.ReactNode;
  // forward relevant button props
} & React.ComponentProps<typeof Button>;

const TONE_TO_VARIANT = {
  primary: "primary",
  secondary: "secondary", // custom BEM: .button--secondary mapped to orange
  neutral: "ghost",
} as const;

export function PillButton({ tone = "primary", className, ...props }: PillButtonProps) {
  return (
    <Button
      variant={TONE_TO_VARIANT[tone]}
      className={cn("rounded-2xl", className)}
      {...props}
    />
  );
}
```

### Migration notes
- `asChild` pattern is no longer needed. Keep button semantics for actions; for navigation use `Link`/`NavLink` with HeroUI button classes.
- Prefer `onPress` for pressable components (`onClick` is compatibility alias in React Aria).
- `disabled` → `isDisabled`. Update all call sites.
- Remove `@radix-ui/react-slot` dependency after all `asChild` usages are gone.

### Call sites to update
- `GenerateButton.tsx` — uses `PillButton` with `type="submit"`, `disabled`
- `ImagePreviewCard.tsx` — uses `PillButton` with `tone="neutral"`, `onClick`
- `StudioStepperLayout.tsx` — uses `PillButton` with `tone="neutral"` and `tone={primaryActionTone}`
- `AppShellLayout.tsx` — uses `PillButton` with `asChild` wrapping NavLink

---

## E3. TextField → HeroUI TextField compound

**File:** `atoms/TextField.tsx`
**Effort:** Small
**Risk:** Low

### Current

```tsx
export function TextField({ id, label, helperText, error, className, ...props }) {
  return (
    <label htmlFor={id} className="flex flex-col gap-2 text-sm text-ink">
      <span className="font-medium text-ink-soft">{label}</span>
      <SquircleSurface asChild radius="lg" smooth="md">
        <input
          id={id} name={fieldName} autoComplete="off"
          className={cn("w-full bg-surface px-3 py-2.5 ...", error && "bg-[error-mix]")}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : helperText ? `${id}-help` : undefined}
          {...props}
        />
      </SquircleSurface>
      {helperText && <span id={`${id}-help`} className="text-xs text-ink-muted">{helperText}</span>}
      {error && <span id={`${id}-error`} className="text-xs text-error" aria-live="polite">{error}</span>}
    </label>
  );
}
```

### After

```tsx
import { TextField as HeroTextField, Label, Input, Description, FieldError } from "@heroui/react";

type TextFieldProps = {
  id: string;
  label: string;
  helperText?: string;
  error?: string;
} & React.ComponentProps<typeof Input>;

export function TextField({ id, label, helperText, error, ...props }: TextFieldProps) {
  return (
    <HeroTextField
      isInvalid={Boolean(error)}
      validationErrors={error ? [error] : undefined}
    >
      <Label>{label}</Label>
      <Input
        id={id}
        name={props.name ?? id}
        autoComplete={props.autoComplete ?? "off"}
        {...props}
      />
      {helperText && <Description>{helperText}</Description>}
      <FieldError>{error}</FieldError>
    </HeroTextField>
  );
}
```

### What React Aria now handles for free
- `aria-invalid` on the input
- `aria-describedby` linking to description and error
- `aria-live` announcements on error change
- Label-input association via `htmlFor`/`id`

---

## E4. TextareaField → HeroUI TextField + TextArea

**File:** `atoms/TextareaField.tsx`
**Effort:** Small — identical pattern to E3

### After

```tsx
import { TextField, Label, TextArea, Description, FieldError } from "@heroui/react";

export function TextareaField({ id, label, helperText, error, ...props }) {
  return (
    <TextField isInvalid={Boolean(error)} validationErrors={error ? [error] : undefined}>
      <Label>{label}</Label>
      <TextArea id={id} name={props.name ?? id} autoComplete="off" {...props} />
      {helperText && <Description>{helperText}</Description>}
      <FieldError>{error}</FieldError>
    </TextField>
  );
}
```

---

## E5. ToggleField → HeroUI Switch

**File:** `atoms/ToggleField.tsx`
**Effort:** Small
**Risk:** Low

### Current

Custom checkbox with 3 nested SquircleSurface elements (outer label, track background, animated thumb dot), `peer-checked:` Tailwind variants for state changes.

### After

```tsx
import { Switch } from "@heroui/react";

type ToggleFieldProps = {
  id: string;
  label: string;
  helperText?: string;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  className?: string;
};

export function ToggleField({ id, label, helperText, checked, onChange, className }: ToggleFieldProps) {
  return (
    <Switch
      id={id}
      isSelected={checked}
      onChange={onChange}
      className={className}
    >
      <span className="flex flex-col gap-1">
        <span className="font-medium text-ink">{label}</span>
        {helperText && <span className="text-xs text-ink-muted">{helperText}</span>}
      </span>
    </Switch>
  );
}
```

### Call site changes
- `checked` prop → `isSelected`
- `onChange={(event) => handler(event.target.checked)}` → `onChange={(isSelected) => handler(isSelected)}`
- Affects: `PromptExtendToggle`, `WatermarkToggle`, `AdGraphicsPanel` (custom size toggle)

---

## E6. Frame → HeroUI Card

**File:** `atoms/Frame.tsx`
**Effort:** Small
**Risk:** Low

### Current

```tsx
export function Frame({ as, className, children, ...rest }) {
  const Component = as ?? "div";
  return (
    <SquircleSurface asChild radius="xl" smooth="lg">
      <Component className={cn(
        "bg-surface shadow-[0_1px_0_color-mix(in_srgb,var(--color-ink)_8%,transparent)]",
        className,
      )} {...rest}>
        {children}
      </Component>
    </SquircleSurface>
  );
}
```

### After

```tsx
import { Card } from "@heroui/react";

type FrameProps = {
  className?: string;
  children: React.ReactNode;
} & React.ComponentProps<typeof Card>;

export function Frame({ className, children, ...rest }: FrameProps) {
  return (
    <Card className={className} {...rest}>
      {children}
    </Card>
  );
}
```

The BEM override in `index.css` (see `02-design-system-migration.md`) handles the shadow and background styling globally.

### Note on polymorphism
Current Frame supports `as` prop for polymorphic rendering (`<Frame as="article">`). Check all call sites — if no consumer uses `as`, drop it. If some do, use `Card`'s HTML element directly or a wrapper.

---

## E7. FrameCanvas → HeroUI Skeleton

**File:** `atoms/FrameCanvas.tsx`
**Effort:** Small

### After

```tsx
import { Card, Skeleton } from "@heroui/react";

export function FrameCanvas({ label }: { label: string }) {
  return (
    <Card className="p-4">
      <Skeleton className="relative min-h-44 overflow-hidden rounded-xl">
        <div className="absolute inset-0 bg-[linear-gradient(112deg,transparent_0%,color-mix(in_srgb,var(--color-accent-highlight)_18%,transparent)_45%,transparent_100%)] opacity-70" />
        <div className="relative z-10 flex min-h-44 items-center justify-center text-center text-sm text-ink-soft">
          {label}
        </div>
      </Skeleton>
    </Card>
  );
}
```

---

## E8. MetadataChip → HeroUI Chip

**File:** `atoms/MetadataChip.tsx`
**Effort:** Small

### After

```tsx
import { Chip } from "@heroui/react";

export function MetadataChip({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Chip variant="secondary" size="sm">
      <span className="accent-type mr-2 text-[10px] uppercase tracking-[0.15em] text-ink-muted">
        {label}
      </span>
      <span className="font-medium">{value}</span>
    </Chip>
  );
}
```

---

## E9. GenerateButton → HeroUI Button with isPending

**File:** `molecules/GenerateButton.tsx`
**Effort:** Small

### Current

```tsx
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

export function GenerateButton({ label = "Generate", pendingLabel = "Generating...", isPending, disabled }) {
  return (
    <Button type="submit" variant="primary" isPending={isPending} isDisabled={disabled}>
      {isPending ? pendingLabel : label}
    </Button>
  );
}
```

HeroUI Button's `isPending` prop adds `[data-pending]` attribute, enabling CSS-only loading indicator if desired.

---

## E10. PromptExtendToggle / WatermarkToggle → HeroUI Switch wrappers

**Files:** `molecules/PromptExtendToggle.tsx`, `molecules/WatermarkToggle.tsx`
**Effort:** Small (each is ~10 lines)

### After (PromptExtendToggle example)

```tsx
import { Switch } from "@heroui/react";

export function PromptExtendToggle({ id, checked, onChange }) {
  return (
    <Switch id={id} isSelected={checked} onChange={onChange}>
      <span className="flex flex-col gap-1">
        <span className="font-medium text-ink">Prompt Extend</span>
        <span className="text-xs text-ink-muted">Allow the model to rewrite and extend your prompt.</span>
      </span>
    </Switch>
  );
}
```

---

## E11. SeedInput → HeroUI TextField (or NumberField)

**File:** `molecules/SeedInput.tsx`
**Effort:** Small

### After

```tsx
import { TextField, Label, Input, Description, FieldError } from "@heroui/react";

export function SeedInput({ id, value, onChange, error }) {
  return (
    <TextField isInvalid={Boolean(error)} validationErrors={error ? [error] : undefined}>
      <Label>Seed</Label>
      <Input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Optional deterministic seed"
        inputMode="numeric"
      />
      <Description>Integer from 0 to 2147483647. Leave empty for random seed.</Description>
      <FieldError>{error}</FieldError>
    </TextField>
  );
}
```

Alternative: Use HeroUI `NumberField` if you want built-in min/max validation. But since seed is optional and stored as string, `TextField` + `Input` with `inputMode="numeric"` is simpler.

---

## E12. ValidationSummary → HeroUI Card with list

**File:** `molecules/ValidationSummary.tsx`
**Effort:** Small

### After

```tsx
import { Card } from "@heroui/react";

export function ValidationSummary({ title = "Validation Summary", checks }) {
  return (
    <Card className="space-y-3 p-4">
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      <ul className="space-y-2 text-sm text-ink-soft">
        {checks.map((check) => (
          <li key={check.label} className="flex items-center justify-between gap-2">
            <span>{check.label}</span>
            <span className={
              check.valid
                ? "accent-type text-[10px] uppercase tracking-[0.16em] text-success"
                : "accent-type text-[10px] uppercase tracking-[0.16em] text-error"
            }>
              {check.valid ? "Valid" : "Needs Input"}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
```

---

## E13. ImagePreviewCard → HeroUI Card + Button

**File:** `molecules/ImagePreviewCard.tsx`
**Effort:** Small

### After

```tsx
import { Card } from "@heroui/react";
import { Button } from "@heroui/react";

export function ImagePreviewCard({ src, alt, onSwap, onClear }) {
  return (
    <Card className="space-y-3 p-3">
      <div className="flex max-h-[65vh] min-h-52 w-full items-center justify-center overflow-hidden rounded-xl bg-canvas p-2 sm:min-h-60 sm:max-h-[32rem]">
        <img src={src} alt={alt} ... className="h-auto max-h-[60vh] w-full object-contain sm:max-h-[30rem]" />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="ghost" size="sm" onPress={onSwap}>Swap image</Button>
        <Button variant="ghost" size="sm" onPress={onClear}>Clear</Button>
      </div>
    </Card>
  );
}
```

---

## E14. RouteLoadingFrame → Skeleton

**File:** `molecules/RouteLoadingFrame.tsx`
**Effort:** Small — just wraps FrameCanvas which itself becomes Skeleton.

---

## E15. ResultMetadataChips → Loop of HeroUI Chip

**File:** `molecules/ResultMetadataChips.tsx`
**Effort:** Small — just update `MetadataChip` import; since MetadataChip itself is migrated (E8), this file needs no structural changes.

---

## E16. SectionShell → Card composition

**File:** `atoms/SectionShell.tsx`
**Effort:** Small

### After

```tsx
import { Card } from "@heroui/react";

export function SectionShell({ heading, eyebrow, description, actions, children }) {
  return (
    <Card className="p-5 sm:p-7">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          {eyebrow && <p className="accent-type text-[10px] uppercase tracking-[0.2em] text-ink-muted">{eyebrow}</p>}
          <h2 className="ui-title max-w-3xl text-ink">{heading}</h2>
          {description && <p className="max-w-3xl text-sm text-ink-soft">{description}</p>}
        </div>
        {actions && <div className="shrink-0">{actions}</div>}
      </header>
      <div className="mt-6">{children}</div>
    </Card>
  );
}
```

---

## Migration Order for Easy Refactorings

Recommended sequence (respects dependency chain):

1. **E1** — SquircleSurface removal (prerequisite for all others)
2. **E6** — Frame → Card (used by many molecules/organisms)
3. **E2** — PillButton → Button
4. **E3** — TextField → HeroUI TextField
5. **E4** — TextareaField → HeroUI TextField + TextArea
6. **E5** — ToggleField → Switch
7. **E8** — MetadataChip → Chip
8. **E7** — FrameCanvas → Skeleton
9. **E9** — GenerateButton
10. **E10** — Toggle wrappers
11. **E11** — SeedInput
12. **E12–E16** — Remaining molecules (order doesn't matter)
