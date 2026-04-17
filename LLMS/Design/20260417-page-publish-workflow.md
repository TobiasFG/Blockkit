Purpose: add intentional page publish workflow to CMS using existing `page_versions` draft/published model without adding version-history UI, scheduling, or rollback in this slice.

# Problem
- Page storage already supports separate draft and published versions through `pages.draft_version_id`, `pages.published_version_id`, and `public.publish_page(...)`.
- CMS page editor still acts like draft-only flow, so editors cannot publish pages, cannot see what state is live, and cannot distinguish unpublished new pages from published pages with newer draft changes.
- Dashboard and sidebar already show draft-style badges, but those badges are not backed by page-level publish actions or clear live-state messaging.

# Goals
- Let editors publish current page draft from page editor.
- Show whether page is unpublished, published, or has unpublished draft changes.
- Make publish state visible in page list surfaces so editors can scan what is live.
- Reuse existing page draft/published data model and editorial shell patterns already used by content editor.

# Non-goals
- No version history browser.
- No compare diff between draft and published.
- No scheduled publishing.
- No unpublish/archive workflow in this slice.
- No frontend site-render integration changes outside CMS unless current app already reads `published_version_id`.

# Current model
- `page_versions` already stores `draft`, `published`, `archived`, `revision`, `parent_id`, and `published_at`.
- `public.publish_page(_page_id, _meta, _created_by)` already creates new published version from current draft content and passed meta.
- Page editor currently saves title, slug, SEO metadata, and content onto current draft version only.
- `src/lib/pageStatus.ts` already exposes draft-change detection based on draft/published pointer mismatch.

# Proposed UX
## Page editor
- Keep current main-column editing flow.
- Expand side rail draft panel into status/publish panel.
- Show one primary status summary:
  - `Unpublished` when `published_version_id` is null.
  - `Published` when draft and published ids match.
  - `Draft changes` when both exist and differ.
- Show supporting metadata:
  - last published time when available
  - whether current draft has unsaved local edits
  - validation summary for publish readiness
- Actions:
  - `Save draft`
  - `Reset draft`
  - `Publish page`
- `Publish page` disabled when local unsaved edits exist, publish validation fails, or publish request in flight.
- Publish copy should make clear action publishes current saved draft, not unsaved form state.
- After successful publish, page remains open, side rail updates to `Published`, success message confirms live update.

## Dashboard and sidebar
- Keep lightweight draft badge approach.
- Add explicit publish-state text/chip where page rows already expose metadata:
  - `Unpublished`
  - `Published`
  - `Draft changes`
- Prefer short neutral labels over multiple stacked timestamps.
- No extra actions in list rows for first slice unless existing row action layout has obvious room.

# Behavior details
## Save draft
- Keep current save path.
- Save updates `pages.title`, `pages.slug`, draft version `meta`, and draft version `content`.
- Save should not publish.

## Publish
- Before publish, persist no new implicit save. User must save draft first.
- Publish uses current draft version content plus current draft meta.
- Publish should include current page SEO metadata from draft version so live metadata matches draft state.
- Publish should not create another draft version; it should create published revision and move `published_version_id`.
- After publish, page still has same draft pointer. Result: draft and published ids differ unless workflow also syncs draft pointer.

# Decision needed
- Existing SQL function creates new published revision but leaves `draft_version_id` pointing at prior draft revision. That means page still appears to have draft changes immediately after publish.
- Proposed default: after publish, refresh draft pointer to newly published version by creating or assigning matching draft state so page reads as clean/published.
- This needs implementation choice review because it affects revision semantics:
  1. Update SQL workflow so publish also points `draft_version_id` at published revision.
  2. Leave SQL as-is and treat equality differently in UI.
  3. Publish, then create fresh draft clone from published revision so editor has editable clean draft.
- Recommendation: option 3. Editors keep dedicated draft row, status becomes clean after publish, next edits happen on new draft clone from published. This preserves draft/published separation cleanly.

# Server/API changes
- Add page publish server helper in `src/lib/server/PagesController.server.ts`.
- Helper should:
  - load page and current draft version
  - derive current draft meta
  - call `publish_page`
  - normalize post-publish draft state according to approved option
  - return refreshed page record plus publish metadata needed by UI
- Add form/action handling on edit route for publish action.
- Keep slug/title/content save action separate from publish action.

# Data returned to UI
- Extend page editor load data with:
  - publish status
  - last published timestamp
  - has unpublished changes
- Extend page list/sidebar row mapping if current load data does not already include enough fields.

# Validation
- Reuse current page-content and SEO validation used for draft save.
- Publish must fail if page cannot be saved as valid draft.
- If root page has special invariants, same rules apply before publish.

# Review points
- Approve post-publish draft strategy. Recommendation: create fresh clean draft from published revision.
- Confirm whether page lists need publish action buttons now or status only in first slice. Recommendation: status only.

# Risks
- Current SQL semantics may conflict with clean-status expectation after publish.
- Slug/title live data currently lives on `pages`, not version row. Publishing page content may still make title/slug changes live immediately on save. If that is intentional for now, document it clearly; if not, scope expands materially.

# Follow-ups
- Add page revision history and restore later if editorial need grows.
- Add draft-vs-live comparison when publish frequency increases.
- Revisit whether title/slug should become versioned if full page publish separation becomes required.
