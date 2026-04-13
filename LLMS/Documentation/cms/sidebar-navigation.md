Purpose: describe how the CMS sidebar derives and renders nested page navigation.

# How It Works
- The sidebar builds a route tree from the flat `Page[]` list using each page's slug.
- The `/` page is the root of the tree and is labeled with its page title.
- Child pages are nested under the nearest existing ancestor page based on URL segments.
- Pages without a real intermediate parent are attached to the closest existing ancestor instead of creating synthetic nodes.
- Content items render in separate `Content` section using explicit folder records instead of page slugs.
- `Content` section header links to dedicated `/content` library route.

# Behavior
- Any page with children renders an expand/collapse chevron.
- The currently active page and its ancestor chain open automatically.
- Pages show a lightweight `Draft` badge when they have an unpublished draft version or have never been published.
- Dashboard and "New page" remain top-level sidebar actions and are not part of the page tree.
- `Content` section keeps quick link for folder creation and routes content creation to dedicated library page.
- Content folders are collapsible and open automatically for active content item's folder ancestry.
- Content items render as leaf items with block-type badge and link to `/content/[id]`.
- Content items also show lightweight draft-status badge when unpublished or when they have unpublished draft changes.
- When page editor is open, content rows also expose `Add` action and `Insert into page` context-menu action that append live content reference into current draft.
- Content folders and rows also expose visible `Actions` trigger so same operations remain available even when right-click/context-menu behavior is unreliable.
- On wide pointer-capable page-editor layouts, content rows also act as drag sources so editors can drop them into explicit top-level page-editor insertion targets.
- Right-clicking content folder in sidebar opens context menu with create-subfolder and delete actions.
- Right-clicking content item in sidebar opens context menu with insert/delete actions, and visible `Actions` trigger opens same menu.
- Sidebar structural and destructive actions should continue into the same modal pattern used on the dashboard instead of browser `prompt` or `confirm` dialogs.
- Sidebar content actions report pending, success, and error feedback inline within `Content` section instead of only relying on detached global messaging.

# Constraints
- The sidebar only shows real pages stored in the CMS.
- Collapse state is local UI state and resets on refresh.
- Folder collapse state for content items is also local UI state and resets on refresh.
- Folder deletion is still blocked unless folder has no child folders and no content items.
