Purpose: describe Content library that lets editors create content instances from code-defined block types and organize them in folders.

# Overview
Content items are editor-created instances of block definitions from `src/lib/blocks/registry.ts`. They live separately from pages and are managed from dedicated `/content` route.
Content items use draft/publish workflow so editor can save changes without changing live shared version immediately.

# How to use
- Open `/content` from CMS sidebar to manage content items and folders.
- Use folder form on `/content` to add optional folder structure.
- Use content form on `/content` to pick registered block type and create named content item.
- Open content item from `/content` or sidebar tree to edit name, folder, and supported fields.
- Use side-rail primary action button for next step: `Save draft` while edits are unsaved, `Publish` once saved draft changes are ready, `Validation error` when blocked, and no primary button when nothing is pending.
- Use side-rail secondary action button to `Revert changes to draft` or `Revert changes to published` when you want to discard unsaved edits and return to currently loaded source state. Hide it when no unsaved edits exist.
- When page editor is open, use sidebar `Add` action or row context menu to insert content into current page without leaving library tree.
- Content editor uses same calmer shell direction as page editor: editable fields in main column, draft/publish state and record metadata in secondary rail.
- Draft-rail action buttons animate in and out as state changes instead of lingering disabled.

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
- `/content/[id]` keeps draft action controls grouped in one persistent side-rail panel instead of scattering status and actions across multiple top-level cards.
- Nested block lists support the same add, remove, drag-and-drop, and Up/Down reordering controls used on the page editor.
- Pages can reference content items as top-level page-content nodes from page editor.
- Page references continue storing stable content id and should resolve to published content.
- Content-item and folder deletion should use same confirmation-modal pattern across dashboard and sidebar.
- Content delete now means `Move to trash`, with restore handled from dedicated `/trash` route.

# Constraints
- Folder deletion is only allowed when folder has no child folders and no content items.
- Content validation uses shared block registry, including nested `allowedTypes` restrictions.
- Deleting content now shows confirmation modal listing pages that reference it and removes those references from both published and draft pages immediately as part of delete flow.
- Unpublished content items do not have live content yet, so any live-resolution path must treat them as unavailable until published.
- Restoring deleted content does not reinsert removed page references automatically.
