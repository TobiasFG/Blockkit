# Scope
- Core CMS data and workflow invariants.
- Read before changing schema, page/content editors, publish flows, trash, or path logic.

## Pages
- Stable page record has stable id.
- Draft/published identity lives in `page_versions`.
- Draft/publish-together fields:
  - `title`
  - `parent_page_id`
  - `url_name`
  - `path_segment`
  - `content`
  - `meta`
- Editor route uses stable id: `/edit/page/[id]`.
- Root page stays root-only and always resolves to `/`.
- Non-root pages must have parent.
- Draft path resolves through draft parent versions.
- Live path resolves through published parent versions.
- Child may publish while parent has unpublished identity changes; live child path still follows published parent chain.

## Page Content
- `page_versions.content` is source of truth for page structure.
- Shape:
  - top-level `version`
  - reserved `layout: null`
  - ordered `blocks`
- Top-level nodes may be:
  - inline block instances
  - content references: `type: 'reusable'` + stable content id
- Current editor workflow is content-reference-first. Do not add new top-level inline page-block creation unless task explicitly changes product direction.
- Nested `blocks` fields are allowed only where registry says so.
- Content references stay top-level only in current model.

## Content Library
- Content items are reusable block instances backed by code-defined block registry.
- Stable content record keeps stable id.
- Draft/published identity lives in `reusable_block_versions`.
- Draft and published versions are separate rows.
- Draft/publish-together fields:
  - `name`
  - `folder_id`
  - `block_type`
  - `content`
- Newly created content starts unpublished.
- Publish creates new published version, then fresh clean draft clone.
- Page references resolve to published content only.
- Unpublished content has no live resolution.

## Trash
- Page/content delete means move to trash, not hard delete.
- Root page cannot be deleted.
- Pages with child pages cannot be trashed in first pass.
- Deleting content removes references from draft and published pages immediately.
- Restoring content does not reinsert removed references automatically.
- Restoring page requires active parent page.

## Validation Rules
- Block definitions live in code, not DB.
- Unknown block types/fields are rejected.
- Date-like fields are validated in app layer.
- Preserve auth gate while service-role controllers remain in use.
