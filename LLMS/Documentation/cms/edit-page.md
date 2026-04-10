Purpose: describe the current page edit screen and its editing capabilities.

# Overview
The edit page lives at `/edit/[...slug]` and lets you update a page title, page slug, draft SEO metadata, and draft page content. The root page slug remains fixed as `/`.

# How to use
- From the CMS home list, click Edit on a page card.
- Update the Title field, adjust the Slug if needed, edit SEO fields, and build the page content from the registered block types.
- Use the block picker in the Content section to add top-level or nested inline blocks.
- Use the reusable block picker in the Content section to insert top-level live references to existing reusable blocks.
- Drag block cards to reorder within the current list, or use the Up/Down buttons for the same move operations.
- Use the “Back to pages” link to return to the list.

# Notes & constraints
- Nested page slugs are preserved in the edit URL, for example `/about/team` becomes `/edit/about/team`.
- The root page uses the `__root__` alias in the edit URL.
- Non-root slugs are normalized to leading-slash paths before saving.
- Slug segments may contain letters, numbers, dashes, underscores, periods, and tildes.
- Slug segments cannot be `.` or `..`.
- Only the root page can use `/`, and the root page slug cannot be changed.
- SEO values are stored in `page_versions.meta.seo` on the current draft version, not on `pages`.
- SEO title is optional and intended to fall back to `pages.title` if frontend rendering leaves it empty.
- The initial SEO fields are SEO title, meta description, canonical URL, Open Graph image URL, no-index, and no-follow.
- Page content is saved back into `page_versions.content` on the current draft version together with SEO metadata.
- Content editing uses the shared block registry and currently supports `text`, `hero`, and `section` blocks.
- Top-level page content can also include live reusable block references that point at existing `/blocks/[id]` records.
- Required primitive block fields start empty and are validated before save.
- String fields whose key includes `body` render as textareas; other string fields render as single-line inputs.
- Nested `blocks` fields are editable inline and can contain only the block types allowed by the registry definition.
- Reusable block references are top-level only in the first iteration and cannot be nested inside `blocks` fields.
- Reordering supports native drag-and-drop within a single block list plus Up/Down fallback buttons.
- Reusable block cards in the page editor link to the separate `/blocks/[id]` editor and do not support inline editing from the page form.
