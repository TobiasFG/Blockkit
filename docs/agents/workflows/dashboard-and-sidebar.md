# Scope
- CMS home/dashboard and sidebar navigation behavior.

## Use When
- Touching `/`
- Touching sidebar page/content trees
- Changing page/content list ordering, badges, or structural actions

## Invariants
- Dashboard is page-first management surface.
- Content library remains separate primary surface under `/content`, not peer dashboard module.
- New page creation requires title plus parent selection for non-root pages.
- Delete from dashboard means move to trash.
- Action feedback stays close to trigger, not global page banner.

## Page Tree Rules
- Build page tree from draft `parent_page_id`, not current URL path.
- Single root page anchors tree.
- Editor links target stable `/edit/page/[id]`.
- Current page and ancestors should be discoverable without manual deep re-open.
- Status badges should express publish state, not duplicate full editor state machine.

## Content Tree Rules
- Content lives in separate `Content` section with folders.
- Section header links to `/content`.
- Content rows link to `/content/[id]`.
- Sidebar may expose navigation, structural actions, and page-insertion affordances from same tree.

## Constraints
- Collapse state is local UI state and may reset on refresh.
- Desktop collapsed rail shows only top-level modules; choosing page/content entry expands sidebar so deeper selection happens in full sidebar, not inside rail.
- Folder delete blocked when folder has child folders or content.
- Structural/destructive actions should use shared modal pattern, not browser prompts.

## Verification
- Dashboard remains page-first and does not absorb `/content` ownership.
- Page tree still derives from draft hierarchy and links to stable page-editor ids.
- Content tree still separates navigation, structural actions, and insertion affordances without breaking `/content` routing.
- Destructive actions still route through shared modal flow.
