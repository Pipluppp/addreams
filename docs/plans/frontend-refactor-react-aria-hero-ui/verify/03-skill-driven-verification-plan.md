# Skill-Driven Verification Plan

This plan verifies the migration using the requested skill frameworks.

## 0) Preconditions

1. Install dependencies and ensure clean workspace.
2. Run baseline checks:
   - `cd frontend && npm run typecheck`
   - `cd frontend && npm run build`
3. Record route targets:
   - `/`
   - `/product-shoots`
   - `/ad-graphics`

## 1) React Aria Verification (`react-aria`)

Goal: validate interaction semantics, keyboard support, and ARIA behavior for migrated controls.

### Components to verify

- Tabs (`WorkflowTabs`, `ReferenceImageInputTabs`)
- Disclosure (`ProductShootsForm` advanced options)
- Select/ListBox (`SelectField`, `SizePresetSelect`, `OutputFormatSelect`)
- Text fields/text areas (`TextField`, `TextareaField`, prompt components)
- Switch (`ToggleField`, dependent toggles)

### Checks

1. Keyboard navigation: tab order, arrow keys for tabs/select, Enter/Space activation.
2. State attributes: selected, focused, disabled states reflected in DOM attributes.
3. Labels/descriptions/errors correctly associated and announced.
4. Route forms preserve current `focus-first-error` behavior.

### Evidence

- File references with findings in `file:line` format.
- Screen capture notes for each route flow.

## 2) Tailwind Design System Verification (`tailwind-design-system`)

Goal: verify tokens and component class patterns remain coherent and scalable in Tailwind v4 CSS-first setup.

### Checks

1. `@theme` tokens in `frontend/src/index.css` are semantic and consistently consumed.
2. Component classes (`.button`, `.card`, `.tabs__tab`, `.switch__control`, etc.) map cleanly to semantic tokens.
3. State selectors use stable attributes (`data-selected`, `data-focus-visible`, `data-disabled`, etc.).
4. No regressions to spacing/radius/typography hierarchy on key routes.

### Acceptance

- No hard-coded one-off colors where semantic tokens should be used.
- No orphaned legacy squircle tokens or classes.

## 3) React Performance Verification (`vercel-react-best-practices`)

Goal: verify migrated UI does not introduce avoidable bundle or re-render overhead.

### Focused rules

1. `bundle-barrel-imports`: direct imports (already aligned by removing `components/ui` shims).
2. `rerender-dependencies` and `rerender-derived-state-no-effect`: avoid unstable effect dependencies and unnecessary state mirroring.
3. `rendering-conditional-render`: prefer explicit ternaries for conditional sections.
4. `js-early-exit`: keep route/form logic straightforward and branch-early.

### Checks

- Audit key files:
  - `frontend/src/routes/studio/product-shoots.tsx`
  - `frontend/src/routes/studio/ad-graphics.tsx`
  - `frontend/src/components/organisms/AdGraphicsPanel.tsx`
  - `frontend/src/components/molecules/WorkflowTabs.tsx`
  - `frontend/src/components/molecules/ReferenceImageInputTabs.tsx`

## 4) Web UI Guideline Verification (`web-design-guidelines`)

Goal: run a full UI guideline audit against latest rules.

### Required setup per skill

1. Fetch latest guideline document before review:
   - `https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md`
2. Apply all fetched rules to target files/patterns.
3. Emit findings in terse `file:line` format.

### Target patterns

- `frontend/src/components/**/*.tsx`
- `frontend/src/routes/**/*.tsx`
- `frontend/src/index.css`

## 5) Final Verification Matrix

For each goal in `01-initial-goal.md`, mark:

- `PASS`: fully satisfied with evidence.
- `PARTIAL`: behavior correct but visual or structural drift exists.
- `FAIL`: requirement not met; include fix plan and owner file list.

## 6) Regression Test Checklist

1. Product Shoots:
   - Stepper transitions
   - Advanced disclosure open/close
   - Generate/reset flows
2. Ad Graphics:
   - Reference mode tabs selected state and switching
   - Upload/URL mode behavior and preview state
   - Generate/reset flows
3. Global:
   - Mobile nav disclosure
   - Route links semantics
   - Focus ring visibility and keyboard traversal
