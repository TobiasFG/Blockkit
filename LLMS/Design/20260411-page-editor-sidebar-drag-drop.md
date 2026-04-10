Purpose: plan how reusable blocks should move from the persistent CMS sidebar into the page content editor without making insertion depend on pointer-only drag and drop.

# Summary
Editors already have a reusable-block picker inside the page editor and a persistent reusable-block tree inside the CMS sidebar. This change connects those surfaces so an editor can start from the block they already found in the sidebar and insert it into the current page draft more directly.

The feature should speed up a common editing flow, but it must stay accessible to keyboard and touch users and must not make block insertion depend on drag support alone.

# Primary User Action
- Start from a reusable block visible in the sidebar and insert it into the current page draft at a predictable location with minimal navigation overhead.

# Scope
- Support sidebar-to-page-editor insertion for top-level reusable block references only.
- Keep the existing select-based reusable-block insertion control as the non-drag fallback.
- Do not expand reusable references into nested block fields, because the current content model allows them only at the page-content top level.

# Proposed Defaults
- Treat the sidebar reusable block row as draggable only when the current route is a page editor.
- Expose a visible page-editor drop zone tied to the top-level `BlockListEditor` list.
- Default a successful drop to append at the end of the top-level page block list unless the user drops between explicit insertion targets.
- Keep the existing `Add reusable block…` select in place as the baseline insertion path.
- Add a sidebar quick action such as `Insert into page` or `Add to page` for the currently open page editor as the keyboard and touch equivalent.

# Interaction Model
1. Editor opens `/edit/[...slug]` with the CMS sidebar visible.
2. Sidebar reusable-block rows expose drag affordance and insertion action only on page-edit routes.
3. Dragging a reusable block over the page editor reveals top-level insertion targets and a clear valid-drop state.
4. Dropping inserts a reusable reference into draft page content, updates local editor state immediately, and focuses the newly inserted row.
5. Keyboard/touch users can invoke the non-drag insertion action from the sidebar or continue using the existing page-editor select.

# Review Points
- Whether insertion should support explicit between-row drop targets in the first pass or append-only insertion to reduce complexity.
- Whether the keyboard fallback belongs in the sidebar row menu, as a visible button, or both.
- Whether drag affordance should be limited to desktop/pointer-capable contexts while mobile relies entirely on action-based insertion.

# Open Questions
- Should page-editor insertion from the sidebar auto-scroll to the inserted reusable block row after insertion?
- Should the sidebar stay interactive for drag only on wide layouts where both surfaces are simultaneously visible?
- Do we want to support insertion into an empty-state drop target before supporting between-row insertion?

# Risks
- Cross-component state coupling between the shared sidebar and the page editor can become brittle if implemented through route-specific DOM querying instead of an explicit shared store or event channel.
- Drag-only affordances could regress accessibility if the keyboard/touch path is treated as secondary instead of first-class.
- The editor already supports block reordering; adding another drag source increases collision risk between reorder drag and sidebar insertion drag.

# Follow-Ups
- Evaluate whether reusable-block references should support insertion at named positions inside the top-level list after the initial append-based version ships.
- Revisit whether reusable block creation should offer an immediate `Insert into current page` path after creation.
- Include the final drag/drop and non-drag flows in the later accessibility and reduced-motion audit.

# Implementation Notes
- Favor a shared page-editor insertion API or store over direct DOM manipulation between sidebar and editor.
- Reuse existing page-content validation so inserted references still go through the same save path as select-created references.
- Document both drag and non-drag insertion paths in `LLMS/Documentation/cms/edit-page.md` and related sidebar docs when implemented.
