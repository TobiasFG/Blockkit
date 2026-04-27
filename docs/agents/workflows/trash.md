# Scope
- Trash and restore workflow for pages and content.

## Use When
- Touching delete/restore flows, trash route, redirect rules for trashed items.

## Rules
- Delete means move to trash, not hard delete.
- Root page cannot be deleted.
- Pages with child pages cannot be trashed in current slice.
- Trashed page/content should disappear from normal editor/library lists.
- Editing routes for trashed page/content should redirect to `/trash`.
- Sidebar page/content delete actions should refresh active lists after moving rows to trash.

## Restore Rules
- Restore page requires active parent page selection.
- Restore content uses dedicated restore action.
- Restoring content does not reinsert previously removed page references.
- Restore results should use shared CMS toast feedback.

## Reference Removal
- Deleting content removes it from both draft and published pages immediately.
- Moving page to trash does not delete content used on that page.
