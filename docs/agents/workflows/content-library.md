# Scope
- Content library and reusable-content editor workflow.

## Use When
- Touching `/content`, `/content/[id]`, content folders, content publish state, page insertion from content library.

## Rules
- Content items are reusable content instances from `src/lib/blocks/registry.ts`.
- Manage them from dedicated `/content` route, not dashboard.
- Content names are editor-facing labels, not unique ids.
- Stable content id stays constant across draft/published versions.
- Name, folder, block type, and content are versioned together.
- New content starts unpublished.

## Editor Contract
- `/content/[id]` follows same draft/publish action semantics as page editor unless task explicitly changes parity.
- Opening trashed content id redirects to `/trash`.
- Idle no-op actions stay hidden.
- Use shared CMS toasts for transient feedback.
- Nested `blocks` fields use shared block editor patterns.

## Library / Sidebar Rules
- `/content` owns folder creation and content creation.
- Sidebar `Content` section combines navigation, structural actions, and page insertion source.
- Folder delete allowed only when no child folders and no content items.
- Content delete means move to trash.
- Delete confirmation should show affected pages when content is in use.
- Moving content to trash removes published and draft page references immediately.

## Page Integration
- Pages reference stable content ids at top level.
- Live pages resolve published content only.
- Sidebar quick-add and row actions should keep page-editor insertion path intact.

## Verification
- Content editor action states stay aligned with page editor unless task intentionally changes parity.
- Folder delete constraints still block non-empty folders.
- Delete confirmation still surfaces affected-page impact when content is in use.
- Page insertion still resolves published content only.
