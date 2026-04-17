Purpose: describe CMS dashboard landing page as page-first surface with lightweight Content entry point.

# How to use
- Open the CMS root route to review pages and create a new page draft.
- New page flow requires Title, Parent page, and optional URL name.
- The dashboard shows computed draft path preview before page creation.
- Use the `Pages` section to open the most urgent draft work first, then the most recently updated pages.
- Use Content summary only as link into Content library.
- Use `Trash` from sidebar when you need to restore deleted pages or content.

# Behavior
- The dashboard copy should speak to editors and marketers rather than exposing scaffold or implementation wording.
- The primary heading should make page work feel dominant, not balanced against shared-content administration.
- The layout should rely on section spacing, dividers, compact side modules, and lighter inset form areas instead of a dramatic hero plus repeated heavy cards.
- Page rows should read as flat editorial list items with actions aligned to the edge, not miniature cards repeated in a grid.
- Page creation uses simple labels and examples that map to common publishing tasks, while still exposing explicit parent-page structure.
- Page rows show draft path metadata and may also show live path when draft identity differs from published identity.
- Content copy should refer to library surface only as secondary destination.
- Page create/delete feedback is shown inside the `Pages` section near the new-page form instead of sharing a site-wide dashboard message area.
- Pending states should be reflected on the action button that triggered the request when practical, including page creation and destructive actions.
- Destructive actions on the dashboard should use the same confirmation-modal pattern for pages instead of deleting immediately on click.
- Page delete now means `Move to trash`, not permanent removal.
- Moving a page to trash must not delete content featured on that page.
- Pages with child pages cannot be moved to trash in first pass.
- Dashboard should feel visually aligned with page/content editors: warm-neutral light surfaces, restrained metadata labels, and no dark promotional hero treatment.

# Constraints
- Dashboard no longer performs content creation or folder administration.
- This document covers copy and lightweight interaction patterns only; larger information architecture changes belong in a later design-backed change.
