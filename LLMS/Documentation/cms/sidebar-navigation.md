Purpose: describe how the CMS sidebar derives and renders nested page navigation.

# How It Works
- The sidebar builds a route tree from the flat `Page[]` list using each page's draft `parent_page_id`.
- The single root page is the root of the tree and is labeled with its draft page title.
- Child pages are nested under their explicit parent page, not inferred from URL segments.
- Sidebar page links point to stable `/edit/page/[id]` routes instead of path-based editor routes.
- Content items render in separate `Content` section using explicit folder records instead of page paths.
- `Content` section header links to dedicated `/content` library route.

# Behavior
- Any page with children renders an expand/collapse chevron.
- The currently active page and its ancestor chain open automatically.
- Pages show lightweight publish-state badges: `Unpublished`, `Published`, or `Draft changes`.
- Sidebar page metadata shows draft path.
- If draft path differs from live path, the sidebar still keeps page inside draft tree because editor navigation follows draft structure.
- Dashboard and "New page" remain top-level sidebar actions and are not part of the page tree.
- `Trash` is also top-level sidebar action and opens dedicated restore surface.
- `Content` section keeps quick link for folder creation and routes content creation to dedicated library page.
- Content folders are collapsible and open automatically for active content item's folder ancestry.
- Content items render as leaf items with block-type badge and link to `/content/[id]`.
- Content items also show lightweight publish-state badge: `Unpublished`, `Published`, or `Saved draft`.
- When page editor is open, content rows also expose a compact plus-icon quick-add control and `Insert into page` context-menu action that append live content reference into current draft.
- Content folders and rows also expose visible `Actions` trigger so same operations remain available even when right-click/context-menu behavior is unreliable.
- On wide pointer-capable page-editor layouts, content rows also act as drag sources so editors can drop them into explicit top-level page-editor insertion targets.
- Right-clicking content folder in sidebar opens context menu with create-subfolder and delete actions.
- Right-clicking content item in sidebar opens context menu with insert/delete actions, and visible `Actions` trigger opens same menu.
- Sidebar structural and destructive actions should continue into the same modal pattern used on the dashboard instead of browser `prompt` or `confirm` dialogs.
- Sidebar content actions report pending, success, and error feedback inline within `Content` section instead of only relying on detached global messaging.
- Sidebar content delete modal should list affected pages when content is currently in use and label action as moving to trash.

# Constraints
- The sidebar only shows real pages stored in the CMS.
- The sidebar assumes single-root page model.
- Collapse state is local UI state and resets on refresh.
- Folder collapse state for content items is also local UI state and resets on refresh.
- Folder deletion is still blocked unless folder has no child folders and no content items.
- CMS icon usage now routes through `src/lib/icons/index.ts` so package-specific imports stay centralized and icon swaps remain low-churn.
