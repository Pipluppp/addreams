# Qwen Account And API Key Setup (Addreams)

Last updated: 2026-02-14

## Purpose

One-time setup checklist for using official Qwen image APIs with our stack:
1. Backend: Hono on Cloudflare Workers (TypeScript)
2. Upstream: DashScope HTTP API (no SDK in Worker runtime)

## What We Use In This Repo

1. We call DashScope via `fetch` from `backend/src/index.ts`.
2. We do not need DashScope SDK or OpenAI SDK for backend runtime wiring.
3. We keep API keys only in backend secrets/vars, never in frontend.

## Prerequisite

You already have an Alibaba Cloud Model Studio account.

## Step 1: Create API Key In Model Studio

1. Open API Key page for your target region:
   - Singapore: https://modelstudio.console.alibabacloud.com/?tab=playground#/api-key
   - Beijing: https://bailian.console.alibabacloud.com/?tab=model#/api-key
   - US (Virginia): https://modelstudio.console.alibabacloud.com/us-east-1?tab=globalset#/efm/api_key
2. Click `Create API Key`.
3. Select:
   - Owner Account
   - Workspace (default workspace is fine for current sprint)
4. Copy and store the key securely.

Notes:
1. Workspace controls API key permissions.
2. Keys in same workspace share the same model permissions.
3. Key is long-lived until deleted.

## Step 2: Choose Region For Addreams

For current Qwen image docs/workflow in this repo, use:
1. `sg` -> `https://dashscope-intl.aliyuncs.com`
2. or `bj` -> `https://dashscope.aliyuncs.com`

Important:
1. API key and endpoint region must match.
2. Cross-region usage causes auth/service errors.

## Step 3: Local Backend Dev Setup

We use `QWEN_API_KEY` in backend worker config.

1. Create local vars file for backend:
```bash
cp backend/.dev.vars.example backend/.dev.vars
```
2. Edit `backend/.dev.vars` with real values:
```bash
QWEN_API_KEY=your_real_api_key
QWEN_REGION=sg
QWEN_IMAGE_MODEL=qwen-image-max
QWEN_IMAGE_EDIT_MODEL=qwen-image-edit-max
QWEN_TIMEOUT_MS=45000
```

Optional shell env (for ad-hoc curl/scripts):
```bash
export DASHSCOPE_API_KEY="your_real_api_key"
```

## Step 4: Cloudflare Production Secret Setup

Set backend secret in Worker:

```bash
printf '%s' "$QWEN_API_KEY" | npm exec -w backend wrangler secret put QWEN_API_KEY
```

Set runtime vars at deploy time (or in Wrangler config strategy you choose):

```bash
npm exec -w backend wrangler deploy \
  --var QWEN_REGION:sg \
  --var QWEN_IMAGE_MODEL:qwen-image-max \
  --var QWEN_IMAGE_EDIT_MODEL:qwen-image-edit-max \
  --var QWEN_TIMEOUT_MS:45000
```

## Step 5: Quick Verification

1. Backend health:
```bash
curl -i http://127.0.0.1:8787/api/health
```
2. Text-to-image route (after backend wiring lands):
```bash
curl -i -X POST http://127.0.0.1:8787/api/workflows/image-from-text \
  -H 'content-type: application/json' \
  -d '{"prompt":"A clean product photo on white background"}'
```

## Common Setup Failures

1. `InvalidApiKey`:
   - Wrong key
   - Wrong region endpoint for the key
2. Key exists in shell but app still fails:
   - restarted shell/IDE required
   - Worker secret/vars not deployed
3. Permission errors:
   - workspace/model access issue
   - RAM user removed/disabled invalidates user-owned keys

## Security Rules

1. Never commit API keys.
2. Never expose API keys to frontend/browser.
3. Rotate key immediately if exposed.

## References

1. Get API key: https://www.alibabacloud.com/help/en/model-studio/get-api-key
2. Configure env variable: https://www.alibabacloud.com/help/en/model-studio/configure-api-key-through-environment-variables
3. Install SDK (not required for our Worker runtime): https://www.alibabacloud.com/help/en/model-studio/install-sdk
