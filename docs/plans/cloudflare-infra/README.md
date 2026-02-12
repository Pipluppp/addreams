# Cloudflare Infra Sprint Plan Pack

Last updated: 2026-02-12

## Goal

Capture post-Qwen infrastructure work that is intentionally deferred until after Qwen image API wiring is deployed and stable.

## Why This Is Separate

`docs/plans/backend-qwen-integration/` now focuses only on integrating and deploying Qwen image APIs. This folder holds the next implementation sprint(s) for infrastructure hardening.

## Document Map

1. `docs/plans/cloudflare-infra/01-post-qwen-infra-sprint.md`
   - Sequenced backlog for R2, D1, Queues, and optional service-binding hardening.

## Entry Criteria

1. Qwen text-to-image and image-edit routes are live in production.
2. Frontend proxy path `/api/*` is stable after deployment.
3. Basic operational smoke tests pass consistently.
