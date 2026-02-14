# Qwen Wiring Decisions (Current Sprint)

Last updated: 2026-02-14

## Decision Summary

1. Use official DashScope HTTP API for both image routes.
2. Keep backend stateless for this release.
3. Introduce Zod at the API boundary now.
4. Defer Drizzle until D1 is introduced.

## Tooling Decisions (`Zod`, `Drizzle`, etc.)

1. `Zod`: **Yes, now**
   - Reason: request validation and payload normalization are needed immediately even without a database.
   - Scope: backend route input schemas + internal normalized DTOs.
2. `Drizzle ORM`: **No, defer**
   - Reason: no D1/storage in this sprint, so ORM adds setup cost without runtime value.
   - Trigger to adopt: when D1 job records/history are added.
3. `R2`: **No, defer**
   - Reason: initial goal is functional generation, not durable URLs.
4. `Queues`: **No, defer**
   - Reason: sync flow is enough for MVP and simpler to debug.

## Route Contract Decisions

1. Public backend routes remain:
   - `POST /api/workflows/image-from-text`
   - `POST /api/workflows/image-from-reference`
2. Backend accepts current frontend envelope for compatibility, but normalizes to internal DTO before calling Qwen.
3. Backend ignores client-provided model IDs and uses server config.
4. Backend removes unsupported upstream fields before forwarding (`output_format`, `response_format`, legacy `type` wrappers).

## Provider Configuration Decisions

1. Required secret: `QWEN_API_KEY`.
2. Default region: `sg` (`dashscope-intl.aliyuncs.com`).
3. Optional env overrides:
   - `QWEN_REGION=sg|bj`
   - `QWEN_IMAGE_MODEL` (default `qwen-image-max`)
   - `QWEN_IMAGE_EDIT_MODEL` (default `qwen-image-edit-max`)
   - `QWEN_TIMEOUT_MS` (default `45000`)
4. Region and API key must match; cross-region key use is treated as config error.

## Normalized Success Response (Backend -> Frontend)

```json
{
  "workflow": "image-from-text",
  "status": "completed",
  "requestId": "backend-generated-uuid",
  "provider": {
    "name": "qwen",
    "requestId": "provider-request-id",
    "model": "qwen-image-max"
  },
  "output": {
    "images": [{ "url": "https://..." }],
    "expiresInHours": 24
  },
  "usage": {
    "imageCount": 1,
    "width": 1664,
    "height": 928
  }
}
```

Notes:
1. `image-from-reference` uses same shape, with potentially multiple `output.images`.
2. URL persistence is caller responsibility in this sprint.

## Error Policy Decisions

1. Validation failures -> `400`.
2. Provider 4xx failures -> `502` with safe provider context (no secrets echoed).
3. Provider 5xx/timeouts -> `502` or `504`.
4. Error payload shape:

```json
{
  "error": {
    "code": "UPSTREAM_INVALID_PARAMETER",
    "message": "size is invalid",
    "providerCode": "InvalidParameter",
    "providerRequestId": "..."
  },
  "requestId": "backend-generated-uuid"
}
```

## Cloudflare + Hono Runtime Decisions

1. Use native `fetch` in Worker runtime for Qwen HTTP calls.
2. Keep CORS on `/api/*`.
3. Keep frontend same-origin `/api/*` proxy path unchanged.
4. Use `wrangler tail` for live route diagnostics in deploy verification.

## Deferred Decisions

1. Durable URL strategy (R2 copy-on-success).
2. Data model for generation history (D1 + Drizzle schema).
3. Async orchestration and retry policy with queues.
4. Authn/authz and per-user quota enforcement.
