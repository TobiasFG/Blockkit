Purpose: describe how the CMS sidebar derives and renders nested page navigation.

# How It Works
- The sidebar builds a route tree from the flat `Page[]` list using each page's slug.
- The `/` page is the root of the tree and is labeled with its page title.
- Child pages are nested under the nearest existing ancestor page based on URL segments.
- Pages without a real intermediate parent are attached to the closest existing ancestor instead of creating synthetic nodes.
- Reusable blocks render in a separate `Blocks` section using explicit folder records instead of page slugs.

# Behavior
- Any page with children renders an expand/collapse chevron.
- The currently active page and its ancestor chain open automatically.
- Pages show a lightweight `Draft` badge when they have an unpublished draft version or have never been published.
- Dashboard and "New page" remain top-level sidebar actions and are not part of the page tree.
- The `Blocks` section has quick links to create folders and reusable blocks on the CMS home page.
- Block folders are collapsible and open automatically for the active reusable block's folder ancestry.
- Reusable blocks render as leaf items with a block-type badge and link to `/blocks/[id]`.
- Reusable blocks also show a lightweight draft-status badge when they are unpublished or have unpublished draft changes.
- Right-clicking a block folder in the sidebar opens a context menu with create-subfolder and delete actions.
- Right-clicking a reusable block in the sidebar opens a context menu with a delete action.
- Sidebar structural and destructive actions should continue into the same modal pattern used on the dashboard instead of browser `prompt` or `confirm` dialogs.
- Sidebar block actions report pending, success, and error feedback inline within the `Blocks` section instead of only relying on detached global messaging.

# Constraints
- The sidebar only shows real pages stored in the CMS.
- Collapse state is local UI state and resets on refresh.
- Folder collapse state for reusable blocks is also local UI state and resets on refresh.
- Folder deletion is still blocked unless the folder has no child folders and no reusable blocks.
