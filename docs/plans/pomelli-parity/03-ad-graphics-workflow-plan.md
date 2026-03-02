# 03 - Ad Graphics Workflow Plan

Last updated: 2026-03-02
Status: Planned

## Objective
Evolve `Ad Graphics` into a campaign-first workflow inspired by Pomelli `Campaigns`, while preserving Addreams naming and model constraints.

## State Map
1. `AG-CAMPAIGN-HOME` (PM-12)
2. `AG-IDEA-SUGGESTIONS` (new, inferred parity state)
3. `AG-CREATIVE-COMPOSE` (new)
4. `AG-CREATIVE-GENERATING` (new)
5. `AG-CREATIVE-RESULTS` (new)
6. `AG-EDIT-SINGLE` (reuse editor patterns from Product Shoots)

## UX Spec

### 1) Campaign home
1. Top prompt composer:
   - campaign objective text
   - controls: product grounding, image count, aspect ratio
   - primary action: `Suggest Ideas`
2. Below composer:
   - recent campaigns list
   - personalized suggestion blocks (using history/context signals)

### 2) Idea suggestions
1. Generate idea cards from campaign prompt.
2. Each card includes:
   - headline concept
   - short direction
   - optional visual tone tags
3. Actions:
   - `Use Idea`
   - `Refine Ideas`

### 3) Creative compose/generate
1. Choosing an idea opens creative compose:
   - positive prompt prefilled
   - optional reference image attachments
   - size/count controls
2. Generation returns multiple variants with quick-select actions.

### 4) Result and iteration
1. Gallery with per-image actions:
   - edit
   - download
   - save/reuse
2. Optional "promote to campaign set" action to group selected outputs.
3. Single-image editor matches Product Shoots interaction model for consistency.

## Frontend Architecture Plan
1. Refactor `frontend/src/routes/studio/ad-graphics.tsx` into campaign-oriented subflows.
2. Add new components:
   - `CampaignPromptComposer`
   - `CampaignIdeaList`
   - `CampaignRecentCards`
   - `AdGraphicsResultGallery`
3. Reuse shared primitives planned in `04-shared-design-system-and-guidance.md`.
4. Route-level state should support draft recovery and safe reset behavior.

## API/Contract Plan
1. Add a campaign idea endpoint:
   - `POST /api/campaigns/suggest`
2. Add campaign persistence endpoints:
   - `GET /api/campaigns`
   - `POST /api/campaigns`
   - `GET /api/campaigns/:id`
3. Continue using existing generation endpoints for final image generation.
4. Keep all campaign endpoints auth-gated and credit-safe.

## Validation and Guardrails
1. Suggest action requires minimum viable campaign prompt.
2. Generation from idea requires either prompt-only or prompt+reference validity.
3. Recoverable errors:
   - idea generation fail
   - creative generation fail
   - persistence fail (campaign save)
4. Out-of-credits gating remains visible before expensive actions.

## Acceptance Criteria
1. User can go from campaign prompt to idea list to generated assets in one continuous flow.
2. Recent campaigns render stable metadata and are revisit-able.
3. Ad Graphics outputs are editable and downloadable without route loss.
4. Campaign flow does not regress existing auth/credit checks.
5. Loading, error, and empty states are explicit at each stage.

