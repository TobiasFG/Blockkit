Purpose: define the first draft-only page content editor for `page_versions.content` on the existing page edit screen.

# Goal
- Let editors create, order, edit, and remove page blocks on the existing `/edit/[...slug]` screen.
- Use the existing block registry and typed `page_versions.content` model as the source of truth.
- Keep the first iteration small enough to ship without solving reusable-block references or advanced field types.

# Scope
- Add page content editing to the existing page edit form.
- Support top-level page blocks plus nested `blocks` fields from the registry.
- Save draft content back into `page_versions.content` together with the rest of the edit form.
- Show validation feedback for invalid or incomplete block data before save.
- Keep the UI and stored data aligned with the shared block registry definitions.

# Non-goals
- Do not add reusable block references in this change.
- Do not add a publish workflow beyond the existing draft-version model.
- Do not add advanced field types such as rich text, media, enums, or custom per-field validation.
- Do not add drag-and-drop if simpler ordering controls are sufficient.
- Do not design frontend rendering of blocks outside the CMS editor.

# Existing constraints
- The edit page currently supports title, slug, and draft SEO metadata, but page content editing is still a placeholder.
- `page_versions.content` already has typed parse/serialize helpers and a block registry with `text`, `hero`, and `section`.
- Nested blocks are valid in the content model via fields of type `blocks`.
- Reusable blocks already have a separate editor and are out of scope for this first page-content editing pass.

# Proposed UX
Add a `Content` section to the page edit form below SEO metadata.

Each block list should support:
- Add block from the registered block types allowed in that list.
- Edit primitive fields inline.
- Remove a block.
- Move a block up or down within its current list.
- Expand nested `blocks` fields inline under their parent block.

Block editing behavior:
- Render one card per block with the block label, type, and ordering controls.
- Render primitive fields using simple inputs by field type:
  - `string` -> text input or textarea for longer labels if already established in code.
  - `date` -> text-like date input that preserves the stored string shape.
  - `number` -> numeric input.
  - `boolean` -> checkbox or switch.
- Render `blocks` fields as nested block lists with their own add/reorder/remove controls.

# Data model and save behavior
- Continue loading the current draft version through existing page-version helpers.
- Treat the editor state as a mutable draft representation of `PageContent`.
- Save all changes through the existing page edit submission path so title, slug, SEO metadata, and content persist together.
- Preserve block `id` values for existing blocks.
- Generate a new unique block `id` when creating a block.

# Defaults and decisions
- Default new page content to `{ version: 1, layout: null, blocks: [] }` when draft content is empty.
- Default new blocks to empty or false-y field values that match the registry field type:
  - required `string`, `date`, `number` fields start as empty strings
  - optional primitive fields may be omitted until edited if that matches existing helpers better
  - `boolean` fields default to `false`
  - `blocks` fields default to `[]`
- Use simple up/down controls for ordering in the first iteration instead of drag-and-drop.
- Allow nested editing for any registry field of type `blocks`.
- Keep `layout` hidden and fixed to `null`.

# Validation
- Continue using shared page-content parsing/serialization on save as the final gate.
- Add editor-side validation messages for:
  - missing required fields
  - invalid primitive input formats
  - unknown or disallowed nested block types
- Block save when the content tree fails validation.
- Keep validation errors anchored to the relevant block and field where possible.

# Implementation plan after approval
1. Extend the page edit loader/action shape to read and write typed content alongside the existing draft metadata fields.
2. Add editor helpers for creating block instances, default field values, nested updates, and block reordering.
3. Build reusable block-list form components that can render registry-defined fields recursively.
4. Replace the page-content placeholder on the edit screen with the draft content editor.
5. Add tests for content editing helpers and form submissions covering create, edit, remove, reorder, and nested blocks.
6. Update CMS documentation for the edit screen after implementation.

# Review points
- Reviewed on 2026-04-10: drag-and-drop is required in the first release.
- Reviewed on 2026-04-10: nested block editing should ship in the first pass.

# Open questions
- Reviewed on 2026-04-10: required primitive fields should initialize as empty strings.
- Reviewed on 2026-04-10: long `string` fields such as `text.body` should use a textarea in the first pass.
- Reviewed on 2026-04-10: generated UUIDs are acceptable for new block ids.

# Risks
- Recursive editing can make the form hard to scan if nested block controls are not visually clear.
- Saving title, SEO, slug, and content in one form increases the surface area for validation and regression on the edit screen.
- If the registry expands quickly, a fully generic field renderer may need stronger field-level UI hints than currently exist.

# Follow-ups
- Add reusable block references from within page content once the basic page editor flow is stable.
- Consider drag-and-drop ordering if up/down controls prove too slow for larger pages.
- Consider richer field presentation metadata in the block registry if more block types are added.

# Recommendation
- Review and approve this design before implementation.
- If approved, implement the editor as a draft-only enhancement to the existing page edit screen without pulling reusable blocks into scope yet.
