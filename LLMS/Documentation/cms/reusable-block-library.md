Purpose: describe Content library that lets editors create content instances from code-defined block types and organize them in folders.

# Overview
Content items are editor-created instances of block definitions from `src/lib/blocks/registry.ts`. They live separately from pages and are managed from dedicated `/content` route.
Content items use draft/publish workflow so editor can save changes without changing live shared version immediately.

# How to use
- Open `/content` from CMS sidebar to manage content items and folders.
- Use folder form on `/content` to add optional folder structure.
- Use content form on `/content` to pick registered block type and create named content item.
- Open content item from `/content` or sidebar tree to edit name, folder, and supported fields.
- Use `Save draft` to update the editable draft version.
- Use `Publish` when current draft should become live content version used by page references.
- When page editor is open, use sidebar `Add` action or row context menu to insert content into current page without leaving library tree.

# Behavior
- Content items are stored independently from page content.
- Folder organization is explicit and does not depend on page URLs.
- Content names are human-friendly labels and do not need to be unique.
- Content items keep stable top-level id while content is versioned as draft/published rows.
- Newly created content items start unpublished until first explicit publish.
- Sidebar shows lightweight status badges for unpublished content and content with unpublished draft changes.
- `/content` route shows same status badges and exposes creation controls for folders and content.
- Sidebar keeps structural folder actions nearby and acts as content source for page-editor insertion actions and drag/drop.
- Container-style content items can edit nested `blocks` fields inline in `/content/[id]` editor.
- Nested block lists support the same add, remove, drag-and-drop, and Up/Down reordering controls used on the page editor.
- Pages can reference content items as top-level page-content nodes from page editor.
- Page references continue storing stable content id and should resolve to published content.
- Content-item and folder deletion should use same confirmation-modal pattern across dashboard and sidebar.

# Constraints
- Folder deletion is only allowed when folder has no child folders and no content items.
- Content validation uses shared block registry, including nested `allowedTypes` restrictions.
- Deleting content now shows confirmation modal listing pages that reference it and removes those live references from affected draft pages as part of delete flow.
- Unpublished content items do not have live content yet, so any live-resolution path must treat them as unavailable until published.
