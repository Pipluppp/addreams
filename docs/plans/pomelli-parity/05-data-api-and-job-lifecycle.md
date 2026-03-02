# 05 - Data, API, and Job Lifecycle Plan

Last updated: 2026-03-02
Status: Planned

## Objective
Define the backend/data work needed to support template-guided creation, campaign suggestions, and iterative editing.

## Current Backend Baseline
1. Existing workflow generation endpoints:
   - `POST /api/workflows/image-from-text`
   - `POST /api/workflows/image-from-reference`
2. Existing history endpoints:
   - `GET /api/history`
   - `GET /api/history/:id`
   - `GET /api/history/:id/asset`
   - `DELETE /api/history/:id`
3. Existing credit reservation/refund model with per-workflow balances.

## New Domain Requirements
1. Template catalog with categories and metadata.
2. Campaign drafts/ideas and campaign runs.
3. Iteration lineage between generated outputs and edits.
4. Recommendation materialization (recent + suggested campaign cards).

## API Additions (Proposed)
1. `GET /api/templates`
   - query: `workflow=product-shoots`, optional `category`, optional `limit`
   - returns: curated template records
2. `POST /api/campaigns/suggest`
   - input: campaign prompt, optional product URL, optional selected assets
   - returns: idea list with concise copy and tags
3. `POST /api/campaigns`
   - persists campaign draft or generated set
4. `GET /api/campaigns`
   - recent campaigns for sidebar/home cards
5. `GET /api/campaigns/:id`
   - campaign detail with linked assets/history
6. Optional iteration endpoint (if needed for lineage semantics):
   - `POST /api/workflows/image-edit-iterate`

## Schema Extensions (D1/Drizzle)
1. `template` table:
   - id, workflow, category, label, preview_asset_key, metadata, is_active, sort_order
2. `campaign` table:
   - id, user_id, title, prompt, status, created_at, updated_at
3. `campaign_idea` table:
   - id, campaign_id, text, tags, rank
4. `generation_lineage` table:
   - id, parent_generation_id, child_generation_id, edit_prompt
5. Keep `generation` table as primary source for output metadata/history assets.

## Lifecycle and State Contracts
1. Generation lifecycle:
   - `pending` -> `succeeded` or `failed`
2. Idea lifecycle:
   - `suggested` -> `selected` -> `generated` (optional mapping)
3. Edit lineage:
   - every edit links to parent output for traceability and UX recap panels.

## Credit and Idempotency Rules
1. Credit reserve before provider call.
2. Refund on terminal failure.
3. Record request IDs and provider request IDs for replay diagnostics.
4. For suggestion endpoints:
   - do not consume generation credits unless expensive model call policy requires it.
   - if credits are consumed, document policy explicitly in API contract.

## Response Shape Requirements
1. Every mutation returns:
   - `requestId`
   - status
   - user-visible error code/message on failure
2. Every generation success returns:
   - `generationId`
   - output image list
   - updated credits
3. Campaign suggestion success returns:
   - deterministic array of idea objects with stable IDs.

## Acceptance Criteria
1. Frontend can fetch templates and render categorized picker without hardcoded data.
2. Campaign suggestions are generated and persisted/recoverable.
3. Edit lineage can be reconstructed for any generated output.
4. Existing history endpoints remain backwards compatible.
5. Credit integrity remains correct under retries/failures.

