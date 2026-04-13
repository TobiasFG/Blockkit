Purpose: describe the reusable block library that lets editors create content instances from code-defined block types and organize them in folders.

# Overview
Reusable blocks are editor-created instances of block definitions from `src/lib/blocks/registry.ts`. They live separately from pages and are managed from the dedicated `/blocks` library route.
Reusable blocks use a draft/publish workflow so the editor can save block changes without changing the live shared version immediately.

# How to use
- Open `/blocks` from the CMS sidebar to manage reusable blocks and folders.
- Use the folder form on `/blocks` to add optional folder structure for reusable blocks.
- Use the shared-content form on `/blocks` to pick a registered block type and create a named reusable block entry.
- Open a reusable block from `/blocks` or the sidebar tree to edit its name, folder, and supported fields.
- Use `Save draft` to update the editable draft version.
- Use `Publish` when the current draft should become the live reusable block version used by page references.
- When a page editor is open, use the sidebar `Add` action or the row context menu to insert the reusable block into the current page without leaving the library tree.

# Behavior
- Reusable blocks are stored independently from page content.
- Folder organization is explicit and does not depend on page URLs.
- Reusable block names are human-friendly labels and do not need to be unique.
- Reusable blocks keep a stable top-level id while their content is versioned as draft/published rows.
- Newly created reusable blocks start unpublished until the first explicit publish.
- The sidebar shows lightweight status badges for unpublished blocks and blocks with unpublished draft changes.
- The `/blocks` library route shows the same status badges and exposes creation controls for folders and shared content.
- The sidebar keeps structural folder actions nearby and now acts as the reusable-block source for page-editor insertion actions and drag/drop.
- Container-style reusable blocks can edit nested `blocks` fields inline in the `/blocks/[id]` editor.
- Nested block lists support the same add, remove, drag-and-drop, and Up/Down reordering controls used on the page editor.
- Pages can reference reusable blocks as top-level page-content nodes from the page editor.
- Page references continue storing the stable reusable block id and should resolve to the published reusable block content.
- Reusable block and folder deletion should use the same confirmation-modal pattern across the dashboard and sidebar.

# Constraints
- Folder deletion is only allowed when the folder has no child folders and no reusable blocks.
- Reusable block validation uses the shared block registry, including nested `allowedTypes` restrictions.
- Deleting a reusable block now shows a confirmation modal listing the pages that reference it and removes those live references from affected draft pages as part of the delete flow.
- Unpublished reusable blocks do not have live content yet, so any live-resolution path must treat them as unavailable until they are published.
