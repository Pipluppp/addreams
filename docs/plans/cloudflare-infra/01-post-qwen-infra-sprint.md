# Post-Qwen Cloudflare Infra Sprint

Last updated: 2026-02-12

## Objective

Add durability, observability, and scaling infrastructure after Qwen image API wiring is already deployed.

## Sprint Ordering

1. Sprint A: R2 media persistence (highest priority)
2. Sprint B: D1 workflow metadata/history
3. Sprint C: Queues and async processing (only if needed)
4. Sprint D: Optional frontend->backend service binding hardening

## Sprint A: R2 Persistence

1. Create R2 bucket for generated assets.
2. Add R2 binding to backend Worker.
3. Download upstream Qwen result URLs and store objects in R2.
4. Return stable R2 URLs (or signed delivery pattern) in API responses.
5. Add retention/lifecycle policy and naming conventions.

## Sprint B: D1 Metadata Layer

1. Create D1 database and bind to backend Worker.
2. Add schema for workflow runs, request IDs, provider IDs, statuses, timestamps.
3. Persist per-request metadata for support/debug/audit.
4. Add minimal query endpoints/admin tooling only if needed.

## Sprint C: Queue-Based Async Processing (Conditional)

1. Add Cloudflare Queue producer/consumer when synchronous processing becomes fragile.
2. Implement idempotency and retry strategy.
3. Add dead-letter handling and operational dashboards.

## Sprint D: Service Binding Hardening (Optional)

1. Evaluate replacing URL-based frontend->backend proxy target with service bindings.
2. Keep external behavior stable (`/api/*` from frontend).
3. Roll out with controlled verification in staging/production.

## Exit Criteria

1. Generated assets remain accessible beyond provider temporary URL lifetime.
2. Workflow metadata is queryable for debugging and support.
3. Async retry path exists only if operationally justified.
4. Deployment runbook updated to reflect new resources and bindings.

## References

1. Storage options: https://developers.cloudflare.com/workers/platform/storage-options/
2. R2 Worker API: https://developers.cloudflare.com/r2/get-started/workers-api/
3. D1 getting started: https://developers.cloudflare.com/d1/get-started/
4. Queues config: https://developers.cloudflare.com/queues/configuration/configure-queues/
5. Service bindings: https://developers.cloudflare.com/workers/runtime-apis/bindings/service-bindings/
