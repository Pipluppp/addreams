# Step 03: History Generation Plan Sketch

## Goal

Persist every generation for authenticated users, with metadata in D1 and assets in R2, and expose a usable history UI.

## Current Gap

- Workflows run and return outputs, but history records are not consistently persisted and browsable per user.
- No durable linkage between user, prompt/config, provider response, and stored asset key.

## Scope

- Backend: persist generation lifecycle and expose history endpoints.
- Database: add generation tables and indexes.
- Storage: store outputs in R2 with stable keys.
- Frontend: history list and detail view.
- Auth: generation + history access are authenticated-only and user-scoped.

## Data Model Sketch

- `generation`
- `id`
- `user_id`
- `workflow`
- `status` (`pending`, `succeeded`, `failed`)
- `input_json`
- `output_json`
- `provider_request_id`
- `provider_model`
- `r2_key`
- `error_code`
- `error_message`
- `created_at`
- `updated_at`

## Backend Sketch

- Create record before provider call with `pending` status.
- On success, upload asset to R2, set `succeeded`, set `r2_key` and output metadata.
- On failure, set `failed` and store normalized error fields.
- Add endpoints:
- `GET /api/history` with pagination and filters.
- `GET /api/history/:id` with owner check.
- `DELETE /api/history/:id` with owner check and optional R2 delete.

## Frontend Sketch

- New `/history` route with paginated list.
- Card rows with thumbnail, workflow tag, created-at, status.
- Detail drawer/page with prompt/settings/output metadata.
- Delete action with confirmation and optimistic update.

## Acceptance Criteria

- New generation appears in history for the signed-in user.
- Users cannot view another user's history item.
- Failed generations are recorded and visible.
- Deleting a generation removes/marks record and handles R2 object policy.
- Unauthenticated users cannot call generation/history endpoints.

## Open Decisions

- Hard delete vs soft delete for generation records.
- Keep failed outputs in R2 or skip upload on failures.
- Pagination method: offset vs cursor.
