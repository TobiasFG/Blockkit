Purpose: describe current page edit screen, draft save flow, and page publish workflow.

# Overview
The edit page lives at `/edit/[...slug]` and lets you update a page title, page slug, draft SEO metadata, and draft page content. The root page slug remains fixed as `/`.

The current layout treats the page body as the primary editing region:
- The main column uses tabs for Identity, Content, and Discovery & Sharing.
- A secondary side rail holds draft state, publish state, save/publish/reset actions, and page record details.
- The page relies on section spacing, dividers, and a dedicated side rail instead of wrapping the whole editor in one large parent card.
- On smaller screens the layout collapses to one column, but the same priority order stays intact.

# How to use
- From the CMS home list, click Edit on a page card.
- Update the Title field, adjust the Slug if needed, then compose page content in the main content region.
- Use the draft panel in the side rail as the primary source of save state, then use its single primary action button for next step.
- When edits are unsaved the button shows `Save draft`, when saved draft changes are ready it shows `Publish`, when validation fails it disables as `Validation error`, and when nothing is pending it disables as `All changes saved`.
- Open the `Discovery & Sharing` tab when you need search or sharing metadata.
- Create and edit content in `/content`, not inside the page editor.
- Use Content sidebar plus-icon quick add or `Insert into page` context-menu action to append selected content into current page draft.
- Use block-row `Actions` control to move row, remove it, or open inline content picker for insertion before that row when you do not want to drag.
- Drag block rows between the visible drop targets to reorder within the current list on wide pointer-capable layouts. The drop targets appear only while dragging.
- Click content item name or `Edit content` link on placed content row to open dedicated `/content/[id]` editor.
- Use `Reset draft` to discard unsaved edits and return to the last saved draft state.
- Publish still uses current saved draft only. Unsaved in-form edits must be saved first.
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
- The current editor labels these with more editor-facing copy such as “Title for search”, “Preferred link”, and “Image for sharing”.
- Save, reset, success, and error messaging is grouped in the side rail so content editing stays visually primary.
- Publish state in the side rail uses three states: `Unpublished`, `Published`, and `Draft changes`.
- `Last published` in the side rail comes from current published page version.
- After publish, CMS creates fresh clean draft from newly published revision so page reads as clean until it changes again.
- Draft/action state is intentionally shown in the side rail instead of being repeated in the page header.
- Search metadata is progressively disclosed behind a collapsible side-rail section so it does not compete with day-to-day content editing.
- The page editor should avoid stacked card-in-card presentation; section boundaries should mostly come from spacing, dividers, and a few purposeful surfaces.
- Block editing should favor flatter rows, inline metadata, and one row-level action menu over repeated nested cards and duplicated controls.
- Typography should stay calm and editorial: fewer heavy weights, quieter uppercase metadata, and body/help text sized for sustained scanning rather than widget chrome.
- Interactive controls should keep visible focus states and touch-safe button sizing as the editor gets flatter.
- Page content is saved back into `page_versions.content` on the current draft version together with SEO metadata.
- Publishing uses current draft `page_versions.content` plus current draft `page_versions.meta`.
- Content editing uses shared block registry, but page editor now composes with linked content items instead of creating new top-level inline blocks.
- Top-level page content can include live content references that point at existing `/content/[id]` records.
- Required primitive block fields start empty and are validated before save.
- String fields whose key includes `body` render as textareas; other string fields render as single-line inputs.
- Nested `blocks` fields are editable inline and can contain only the block types allowed by the registry definition.
- Content references are top-level only in the first iteration and cannot be nested inside `blocks` fields.
- Reordering supports native drag-and-drop within a single block list plus a row-level `Actions` fallback.
- Drag-and-drop is enabled only on wide pointer-capable layouts; touch and mobile devices rely on the visible insertion picker and row menu actions.
- Content rows in the page editor link to separate `/content/[id]` editor and do not support inline editing from page form.
