Purpose: reduce reusable-block-management complexity by identifying which controls must stay immediately visible and which should move behind progressive disclosure.

# Feature Summary
Reusable-block management currently competes with page management on the dashboard and exposes folder structure, creation flows, and maintenance tasks at the same visual level as everyday editing work. This design narrows the default surface to the most common shared-content tasks and moves lower-frequency structural controls behind clearer secondary entry points.

The goal is not to remove capability. It is to stop making every editor parse library-administration controls every time they enter the CMS.

# Primary User Action
- Find and edit an existing reusable block, or create one when needed, without being forced through folder-administration detail on every dashboard visit.

# Distillation
- Keep visible by default: reusable-block list access, draft/live status, edit entry, and one clear create path.
- Deprioritize: folder administration, low-frequency cleanup, and secondary structural controls.
- Remove equal-weight presentation between reusable-block content work and library-maintenance work.

# Proposed Defaults
- Collapse or relocate folder administration out of the main dashboard flow.
- Keep one visible entry point for `Add shared content`, but move advanced structural setup behind a secondary control or dedicated library surface.
- Treat folder management as contextual to the library, not as a peer to page creation.
- Preserve sidebar context actions for quick structural maintenance so the capability still exists near the library tree.

# Review Points
- Whether reusable-block creation should remain on the dashboard at all or move to the library surface once that exists.
- Whether folder creation should be available only contextually from the sidebar and library surface.
- Whether the dashboard should show a shortened list of reusable blocks or only a summary plus a link into the library.

# Open Questions
- Do editors need folder reassignment on the dashboard, or is that better kept inside block editing and library management?
- Should the reusable-block dashboard section show recent items, pinned items, or drafts only if it remains visible?
- Would a dedicated reusable-block library route replace enough dashboard complexity to make additional disclosure unnecessary?

# Risks
- Over-collapsing library actions could slow advanced users if the secondary path is not obvious.
- If creation is hidden too aggressively, editors may stop discovering reusable blocks as an available pattern.
- This design overlaps the dashboard-primary-workflow reframe and should not be implemented with conflicting IA decisions.

# Follow-Ups
- Align dashboard and sidebar labels so shared-content entry points use one consistent vocabulary.
- Update reusable-block documentation once the final surface ownership is approved.
- Include the resulting library interactions in the later accessibility and reduced-motion audit.
