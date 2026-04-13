Purpose: define how the CMS dashboard should center one primary workflow instead of treating page management, reusable blocks, and library administration as equally prominent tasks.

# Feature Summary
The dashboard is currently the CMS landing page, but it still asks editors to parse multiple competing workflows at once: page management, page creation, reusable-block browsing, folder administration, and shared-content creation. The dashboard should instead foreground the most common editorial job and demote lower-frequency library maintenance so the first screen is easier to scan and act from.

This brief assumes the primary workflow is page management and page entry into editing, while reusable-block administration becomes secondary or relocates to a more dedicated surface.

# Primary User Action
- Find the page to work on and move into editing or creation with minimal scanning overhead.

# Design Direction
- Keep the current design context: utilitarian, subtle, refined, and editor-first.
- The landing surface should feel decisive rather than neutral. One section should clearly own the page, and everything else should either support that goal or move out of the way.
- Use layout hierarchy and information grouping, not decorative treatment, to communicate what is primary versus secondary.

# Proposed Defaults
- Make `Pages` the dominant dashboard section and first visible action cluster.
- Keep page creation directly available on the dashboard.
- Move reusable-block management off the dashboard into a dedicated library route and use the dashboard only to link into that surface.
- Remove folder administration and other structural maintenance from the dashboard scan path entirely.
- Treat the sidebar `Blocks` section as the durable navigation entry point into shared-content management.
- Order the main dashboard page list draft-first, then by recent updates, so unfinished editorial work stays visible before lower-priority maintenance.
- Use a more assertive visual hierarchy than the current scaffold so the page workflow is unmistakably primary.

# Layout Strategy
- Start with a narrow, high-signal intro that frames the dashboard as the place to choose or create a page.
- Follow with the page list and page creation actions as the main workflow block.
- Move reusable-block/library information below the fold or behind a lighter secondary entry surface.
- Avoid equal-weight repeated sections that look like peers when their usage frequency is different.

# Review Points
- Confirm that page management is the primary landing workflow, not reusable-block management or mixed operations.
- Reusable blocks should move to a dedicated library route entirely.
- Folder administration should belong only in the dedicated shared-content surface and sidebar context menus.

# Open Questions
- If reusable blocks move off the dashboard, where should editors create a new reusable block from without adding friction?
- Does the product want a separate route for reusable-block library management before implementation begins?

# Risks
- If reusable-block creation is moved too far away without replacement shortcuts, editors who rely on shared content may feel slowed down.
- Reframing the dashboard without clarifying route ownership can create a half-moved IA where both dashboard and secondary routes feel incomplete.
- There is overlap with the reusable-block progressive-disclosure change; the two changes need one coherent destination model.

# Follow-Ups
- After structure is approved, align dashboard copy and empty states with the new primary workflow.
- Revisit dashboard-local feedback placement once the secondary sections are reduced or moved.
- Feed the final structure into the planned accessibility/reduced-motion audit.

# Proposed Route Responsibilities
- Dashboard: page list, page creation, and lightweight shared-content entry points only.
- Sidebar `Blocks`: navigation into reusable-block editing and lightweight structural actions.
- Shared-content surface if needed: folder administration, reusable-block creation, and other lower-frequency library tasks.

# Approved Decisions
- Reusable blocks move to a dedicated library route.
- `Add shared content` moves to the library route and sidebar, not the dashboard.
- Folder administration stays in the library route and sidebar context flows, not the dashboard.
- Dashboard ordering should prioritize draft work first, then recent updates.
- Visual treatment should be assertive enough that the page workflow clearly dominates the landing screen.
