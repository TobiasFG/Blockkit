Purpose: describe the CMS dashboard landing page and the editor-facing language it uses.

# How to use
- Open the CMS root route to review pages, shared blocks, and quick-create forms.
- Use the `Pages` section to open an existing page or add a new one.
- Use the `Reusable blocks` section to manage shared content, folder organization, and block creation.

# Behavior
- The dashboard copy should speak to editors and marketers rather than exposing scaffold or implementation wording.
- The primary heading presents the page as a content dashboard, not a developer-facing editor shell.
- The layout should rely on section spacing, dividers, and lighter inset form areas instead of stacking large card containers inside other card containers.
- Page and shared-section rows should read as flat list items with actions aligned to the edge, not miniature cards repeated in a grid.
- Page creation uses simple labels and examples that map to common publishing tasks.
- Reusable block copy refers to shared content and publishing outcomes instead of internal registry details where possible.
- Page create/delete feedback is shown inside the `Pages` section near the new-page form instead of sharing a site-wide dashboard message area.
- Shared-section create/update/delete feedback is shown inside the shared-sections area so folder and reusable-block actions report status close to the related controls.
- Pending states should be reflected on the action button that triggered the request when practical, including folder saves and destructive actions.
- Destructive actions on the dashboard should use the same confirmation-modal pattern across pages, folders, and reusable blocks instead of deleting immediately on click.

# Constraints
- The dashboard still combines page management and reusable block management on one route.
- This document covers copy and lightweight interaction patterns only; larger information architecture changes belong in a later design-backed change.
