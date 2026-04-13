Purpose: describe the current page edit screen and its editing capabilities.

# Overview
The edit page lives at `/edit/[...slug]` and lets you update a page title, page slug, draft SEO metadata, and draft page content. The root page slug remains fixed as `/`.

The current layout treats the page body as the primary editing region:
- The main column holds page identity fields and the content editor.
- A secondary side rail holds draft state, save/reset actions, SEO settings, and page record details.
- The page relies on section spacing, dividers, and a dedicated side rail instead of wrapping the whole editor in one large parent card.
- On smaller screens the layout collapses to one column, but the same priority order stays intact.

# How to use
- From the CMS home list, click Edit on a page card.
- Update the Title field, adjust the Slug if needed, then build the page content from the registered block types in the main content region.
- Use the draft panel in the side rail as the primary source of save state and validation state, then save or reset the current draft there.
- Open the collapsible search appearance section in the side rail only when you need search or sharing metadata.
- Use the block picker in the Content section to add top-level or nested inline blocks.
- Use the reusable block picker at the top of the Content section to insert top-level live references to existing reusable blocks.
- Use the reusable block `Add` action or `Insert into page` context-menu action from the CMS sidebar to append the selected reusable block into the current page draft.
- Use the block-card `Actions` control to move a row or insert a reusable block before that row when you do not want to drag.
- Drag block cards between the visible drop targets to reorder within the current list on wide pointer-capable layouts. The drop targets appear only while dragging.
- Use `Reset draft` to discard unsaved edits and return to the last saved draft state.
- Use the `Back to pages` action in the header to return to the list.

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
- The current editor labels these with more editor-facing copy such as “Search title”, “Preferred page URL”, and “Sharing image URL”.
- Save, reset, success, error, and validation summary messaging is grouped in the side rail so content editing stays visually primary.
- Draft/save/validation state is intentionally shown in the side rail instead of being repeated in the page header.
- Search metadata is progressively disclosed behind a collapsible side-rail section so it does not compete with day-to-day content editing.
- The page editor should avoid stacked card-in-card presentation; section boundaries should mostly come from spacing, dividers, and a few purposeful surfaces.
- Page content is saved back into `page_versions.content` on the current draft version together with SEO metadata.
- Content editing uses the shared block registry and currently supports `text`, `hero`, and `section` blocks.
- Top-level page content can also include live reusable block references that point at existing `/blocks/[id]` records.
- Required primitive block fields start empty and are validated before save.
- String fields whose key includes `body` render as textareas; other string fields render as single-line inputs.
- Nested `blocks` fields are editable inline and can contain only the block types allowed by the registry definition.
- Reusable block references are top-level only in the first iteration and cannot be nested inside `blocks` fields.
- Reordering supports native drag-and-drop within a single block list plus a row-level `Actions` fallback.
- Drag-and-drop is enabled only on wide pointer-capable layouts; touch and mobile devices rely on the visible insertion picker and row menu actions.
- Reusable block cards in the page editor link to the separate `/blocks/[id]` editor and do not support inline editing from the page form.
