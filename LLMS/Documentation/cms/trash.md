Purpose: describe CMS trash behavior for deleted pages and content.

# How to use
- Open `/trash` from sidebar to review deleted pages and content items.
- Restore a deleted page by choosing an active parent page, then submit `Restore page`.
- Restore a deleted content item with `Restore content`.

# Behavior
- Moving a page to trash removes it from normal CMS lists but does not delete content featured on that page.
- Pages with child pages cannot be moved to trash in first pass.
- Moving content to trash removes it immediately from both published and draft pages where it is used.
- Restoring content makes item available again but does not reinsert removed page references.
- Editing routes for trashed pages/content redirect editors to trash instead of loading normal editor.

# Constraints
- Root page still cannot be deleted.
- Page restore needs an active parent page.
- Folder trash is not part of first pass. Empty-folder delete rule stays unchanged.
