Purpose: define first trash/restore workflow for pages and content so delete becomes reversible, dependency-aware, and clear to editors.

# Problem
- Page delete in `src/routes/+page.server.ts` calls `deletePageById`, which hard-deletes `public.pages`.
- Content delete in `src/routes/content/+page.server.ts` and `src/routes/api/sidebar-actions/+server.ts` removes page references, then hard-deletes `public.reusable_blocks`.
- Editors have no recovery path for mistakes.
- Current content delete warning only lists referencing pages. It does not cover content-to-content dependencies because nested reusable references do not exist today, but future expansion should not paint flow into corner.

# Goals
- Replace hard delete with soft delete for pages and content items.
- Add trash overview where editors can inspect deleted records and restore them.
- Make delete confirmation dependency-aware and harder to misread when item is in use.
- Preserve early-development bias: no migration/back-compat layers beyond direct schema/app replacement needed for current product.

# Non-goals
- Permanent purge workflow in first pass.
- Version-history restore for individual old drafts/published revisions.
- Generic trash for every CMS entity. First pass covers pages and content items only.
- Restoring deleted folders. Folders stay hard-deleted or blocked separately until needed.

# Proposed UX
## Delete behavior
- Unused page/content:
  - Delete action stays single confirmation.
  - Confirm moves record to trash immediately.
- In-use content:
  - Delete modal shows dependency warning with concrete usage list.
  - Primary action label becomes `Move to trash anyway`.
  - Copy explains affected pages will lose live/draft references immediately while item stays restorable from trash.
- Page with children:
  - First pass blocks delete when page has child pages.
- Root page:
  - Still cannot delete.

## Trash overview
- Add `/trash` CMS route.
- Split list into `Pages` and `Content`.
- Each row shows:
  - title/name
  - kind
  - deleted time
  - deleted path or folder context snapshot if available
  - dependency status summary
  - actions: `Restore`
- Sidebar gets low-emphasis `Trash` destination near bottom utility area.

## Restore behavior
- Restoring page/content clears deleted marker, restores visibility in normal CMS lists, preserves draft/published pointers.
- If original parent page or folder is deleted/missing:
  - Page restore allows picking a new active parent.
  - Content restore falls back to no folder if folder missing.
- If restoring content whose references were stripped from pages at delete time:
  - Do not auto-reinsert references in first pass.
  - Trash row and restore success message must state this clearly.

# Data model
## Pages
- Add columns on `public.pages`:
  - `deleted_at timestamptz null`
  - `deleted_by uuid null` only if auth user id easy to thread; otherwise skip first pass
- Queries for active CMS pages must filter `deleted_at is null`.
- Existing `parent_page_id` FK remains. Deleted parent page should block child restore unless parent restored first.

## Content
- Add columns on `public.reusable_blocks`:
  - `deleted_at timestamptz null`
  - `deleted_by uuid null` optional same rule as pages
- Queries for active content/folder trees must filter `deleted_at is null`.

## Optional trash metadata
- No separate trash table first pass.
- Use existing rows plus soft-delete timestamp.
- Derive kind-specific display data from current row + linked draft/published version records.

# Dependency handling
## Content usage detection
- Reuse page-reference lookup already used by delete modal.
- Before soft delete, remove content references from both draft and published page content so deletion takes effect immediately everywhere it is used.
- Current content model does not support content-to-content references. If that model changes later, same immediate-removal rule should extend there too.

## Page usage detection
- Child pages count as dependency.
- First pass does not need inbound links/search across arbitrary content because pages are not currently embedded by id inside content model.

# Server changes
- Replace `deletePageById` with soft-delete fn.
- Replace `deleteReusableBlock` with soft-delete fn.
- Update all page/content list loaders to exclude deleted rows by default.
- Add trash loader returning deleted pages/content ordered by `deleted_at desc`.
- Add restore actions for page/content.
- Guard edit routes against deleted records:
  - direct open deleted page/content route should redirect to trash or 404 with recovery hint.

# UI changes
- Dashboard page delete toast changes from `Page deleted successfully.` to `Page moved to trash.`.
- Content delete toast changes from `Content deleted.` to `Content moved to trash.`.
- Delete modals get stronger dependency copy.
- Add `/trash` page with restore actions and empty state.
- Add sidebar nav item for trash.

# Docs
- Update:
  - `docs/agents/workflows/trash.md`
  - `docs/agents/workflows/content-library.md`
  - `docs/agents/workflows/page-editor.md`
- Add trash doc if route gets enough behavior to justify standalone page.

# Open questions
- Do we want `deleted_by` surfaced in UI now, or skip until audit trail matters?
- Is folder trash needed immediately for content management, or can folder delete remain current empty-folder hard delete rule?

# Risks
- Soft delete touches nearly every page/content query; missed filter could leak deleted rows back into active UI.
- Restore without auto-relink may surprise editors unless trash copy is explicit.
- Published pages referencing newly deleted content need deterministic frontend fallback.

# Follow-ups
- Add permanent purge after trash has proven useful.
- Add subtree trash/restore for pages if editors need bulk hierarchy recovery.
- Add richer dependency graph if content model later allows nested reusable references.

# Proposed defaults
- First pass blocks page delete when children exist.
- First pass soft-deletes pages and content only.
- First pass removes deleted content from published and draft pages immediately.
- First pass restores pages with explicit parent picker.
- First pass restores content without auto-relinking removed page refs.
- First pass skips `deleted_by` unless auth plumbing cost is tiny.
