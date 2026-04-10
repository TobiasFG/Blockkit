Purpose: define how the reusable block editor should support editing nested `blocks` fields for container-style reusable blocks.

# Goal
- Let editors create, edit, reorder, and remove nested blocks inside reusable block content on `/blocks/[id]`.
- Reuse the existing block registry, validation model, and recursive editor patterns already used by the page content editor.
- Keep reusable block storage as a single editable record with no publish/version workflow changes in this slice.

# Scope
- Add nested `blocks` field editing to the reusable block edit screen.
- Support recursive add, edit, remove, reorder, and drag-and-drop for any registry field of type `blocks`.
- Validate nested reusable block content before save using the existing block validation rules.
- Keep the reusable block editor aligned with the same field rendering rules used by page content editing where practical.

# Non-goals
- Do not add page references to reusable blocks in this change.
- Do not add draft/publish or version history for reusable blocks.
- Do not introduce new block field types beyond the current registry model.
- Do not redesign the overall reusable block library/sidebar experience.

# Existing constraints
- Reusable block content is stored in `reusable_blocks.content` as one `BlockInstance`.
- The current reusable block editor supports primitive field editing only and explicitly leaves nested `blocks` fields read-only.
- The shared `BlockListEditor` component already supports recursive nested editing for page content, including drag-and-drop and allowed-type constraints.
- `createDefaultBlockInstance()`, `normalizeBlockInstance()`, and `isValidBlockInstance()` already understand nested `blocks` values.

# Proposed UX
On `/blocks/[id]`, render nested `blocks` fields inline inside the main reusable block form instead of a read-only notice.

Behavior:
- Show each nested `blocks` field as a bordered nested editor section under its parent block field.
- Allow adding only the block types permitted by that field's `allowedTypes` constraint.
- Support drag-and-drop and Up/Down controls within the current nested list, matching the page content editor.
- Preserve the current primitive field editing behavior for the root reusable block and any nested blocks.
- Keep block ids visible to aid debugging and consistency with the page editor.

# Data model and save behavior
- Continue loading the reusable block record through the existing server helpers.
- Treat the editor state as a mutable `BlockInstance` draft rooted at `reusable_blocks.content`.
- Save the full nested content tree back through the existing update path for reusable blocks.
- Preserve existing block ids.
- Generate UUIDs for newly added nested blocks.

# Defaults and decisions
- Reuse the existing default field rules from `createDefaultBlockInstance()`:
  - `string`: `''`
  - `boolean`: `false`
  - `blocks`: `[]`
  - `date` and `number`: omitted until edited
- Reuse the existing textarea rule from the page editor where string field keys containing `body` render as textareas.
- Reuse the page editor's drag-and-drop plus Up/Down fallback model instead of inventing a separate interaction pattern.
- Keep save behavior all-or-nothing for the reusable block record; do not partially save nested subtrees.

# Validation
- Continue using `isValidBlockInstance()` and `normalizeBlockInstance()` as the final save gate.
- Add editor-side validation messages for:
  - missing required primitive fields
  - invalid primitive values
  - unknown nested block types
  - nested block types disallowed by a field's `allowedTypes`
- Block save when the reusable block content tree fails validation.

# Implementation plan after approval
1. Extract or adapt the reusable recursive block-editing helpers so the reusable block route can manage nested block paths and updates.
2. Reuse `BlockListEditor` for nested `blocks` fields inside the reusable block editor, or factor shared logic if the current props are too page-specific.
3. Replace the read-only nested field notice on `/blocks/[id]` with recursive editing controls.
4. Add save-time validation and user-facing error rendering for nested reusable block content.
5. Add regression tests covering nested add/edit/remove/reorder flows and invalid disallowed nested content.
6. Update reusable block documentation after implementation.

# Review points
- Reuse the existing `BlockListEditor` interaction model so page content editing and reusable block editing behave the same.
- Keep nested editing in the first implementation rather than introducing a separate follow-up for only partial nested support.

# Open questions
- Should the reusable block editor share the exact same helper/state module as the page editor, or keep a smaller reusable-block-specific wrapper around the shared component?
- Should validation messages be keyed exactly like the page editor for easier component reuse, or simplified for the single-root reusable block case?

# Risks
- Reusing page-editor components too literally may leak page-specific terminology or assumptions into the reusable block editor.
- Deep nesting can make the reusable block form harder to scan without clear visual grouping.
- Recursive client-side updates for a single-root block need careful path handling to avoid mutating the wrong nested list.

# Follow-ups
- Consider extracting a shared block-instance editor module if page and reusable block editing continue to converge.
- Revisit page-to-reusable-block references after reusable nested editing is stable.

# Recommendation
- Review and approve this design before implementation.
- If approved, implement nested reusable block editing by reusing the existing recursive block editor patterns instead of creating a parallel editor system.
