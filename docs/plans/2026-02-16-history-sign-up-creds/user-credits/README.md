# Step 02: User Credits Plan Sketch

## Goal

Make credits authoritative and enforced per user across backend and frontend, with safe decrement logic and clear UX when exhausted.

## Credit Policy (Current Plan Direction)

- Unauthenticated users cannot generate (must sign in first).
- Free account default credits:
- `creditsProductShoots = 1`
- `creditsAdGraphics = 1`
- Every successful generation consumes exactly 1 credit for the corresponding workflow.
- Paid plan placeholder (until final pricing/packaging):
- Target is `$10` for `20 total generations` across both workflows.
- With current dual-counter schema, phase-1 representation is `10 + 10` (Product Shoots + Ad Graphics).
- Later we can migrate to a shared pooled credit model if needed.

## Current Gap

- Credits are displayed in profile but not reliably decremented on generation.
- Feature access is not fully blocked when credits reach zero.

## Scope

- Backend: enforce credits before generation.
- Database: atomic decrement and optional ledger.
- Frontend: disable gated actions and show low/zero-credit states.

## Analysis Inputs Accounted For

- From `2026-02-16-account-auth/analysis.md`: expensive generation endpoints need bounded abuse impact and clear denial behavior under load.
- This step limits authenticated abuse by making credits authoritative server-side, not only UI-visible.
- This step complements security hardening by reducing uncontrolled provider spend and request fanout.

## Data Model Sketch

- Reuse `user_profile` counters for each workflow credit type.
- Add `credit_ledger` table for auditability:
- `id`, `user_id`, `workflow`, `delta`, `reason`, `generation_id`, `created_at`

## Backend Sketch

- Add `reserveCredit(userId, workflow)`.
- Perform atomic decrement with guard (`credits > 0`).
- If decrement fails, return `402` or `403` with typed error code (`OUT_OF_CREDITS`).
- Define refund policy:
- Recommended: refund only for provider/system failure before successful output.
- Write ledger entry for decrement and refunds.
- Return remaining balance in successful generation responses so frontend state can reconcile quickly.

## Frontend Sketch

- Fetch live credits in generation pages.
- Disable generate button when relevant credits are zero.
- Show banner/toast with recharge or contact CTA.
- Keep server as source of truth even if UI appears enabled.
- Handle typed `OUT_OF_CREDITS` response deterministically (no generic error fallback).

## Acceptance Criteria

- Successful generation decrements exactly one relevant credit.
- Parallel requests cannot push credits below zero.
- Failed requests follow the defined refund policy.
- Users with zero credits are blocked server-side and informed client-side.
- Free users start at 1 credit per workflow.
- Paid placeholder users start at 20 total credits (phase-1: 10 per workflow).
- Credit checks remain correct under concurrent requests from the same user session.

## Cost Baseline (Qwen Models)

Source: Alibaba Cloud Model Studio pricing docs (`Last Updated: Feb 16, 2026`):
- https://www.alibabacloud.com/help/en/model-studio/model-pricing

Verified model prices:
- International deployment:
- `qwen-image-max`: `$0.075` per image
- `qwen-image-edit-max`: `$0.075` per image
- Free quota: `100 images each` for new Model Studio activation (valid 90 days)
- Mainland China deployment:
- `qwen-image-max`: `$0.071677` per image
- `qwen-image-edit-max`: `$0.071677` per image
- No free quota

Quick cost implications (international pricing):
- Free starter (2 credits total: 1 + 1) max variable model cost is about `$0.15` per user.
- Paid placeholder (20 credits total) max variable model cost is about `$1.50` per user.
- If sold at `$10`, gross margin before infra/ops/tax is about `$8.50` per fully consumed pack.

## Open Decisions

- Exact HTTP code and error payload standard for `OUT_OF_CREDITS`.
- Whether to support promotional credit grants manually via admin SQL.
- Keep two counters long-term vs migrate to a shared pooled credit field.
