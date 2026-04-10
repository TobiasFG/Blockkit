Purpose: define how pages should reference reusable blocks from the page content editor.

# Goal
- Let editors insert reusable blocks into `page_versions.content` from the existing page editor.
- Preserve the value of the reusable block library by making shared content actually reusable across pages.
- Keep the first integration predictable by choosing one ownership model for page-to-reusable-block behavior.

# Scope
- Define the content model for reusable block references inside page content.
- Define editor behavior for adding, displaying, reordering, and removing reusable block references.
- Define how page validation and save behavior should treat reusable block references.
- Define the minimum implementation slices needed after approval.

# Non-goals
- Do not add frontend rendering of referenced reusable blocks outside the CMS in this change.
- Do not add draft/publish workflow or version history for reusable blocks here.
- Do not allow inline editing of reusable block content from the page editor.
- Do not redesign the reusable block library itself.

# Existing constraints
- `page_versions.content` currently stores only inline `BlockInstance` values.
- The page content editor already supports recursive inline block editing and validation using the code registry.
- Reusable blocks are stored separately in `reusable_blocks` with one editable record per block.
- Reusable blocks do not yet have draft/publish semantics, so any page integration must work with a single live reusable block record.

# Decision: use live references in the first iteration
Pages should store references to reusable blocks, not snapshots.

Why:
- The primary benefit of reusable blocks is centralized updates across pages.
- Snapshots would add more storage and UX complexity immediately while undermining the core reason to reference shared content.
- The current reusable block storage model already behaves like one live record, so references align with the existing system.

Tradeoff:
- Publishing behavior is less isolated because page drafts can point at reusable blocks whose content may later change.
- This is acceptable for the first iteration because reusable blocks already have no separate publish workflow; adding snapshots now would only hide that reality in the data model.

# Proposed model
Extend page content so a page block list can hold either inline blocks or reusable block references.

```ts
type PageBlockNode = BlockInstance | ReusableBlockReference;

type ReusableBlockReference = {
  id: string;
  type: 'reusable';
  reusableBlockId: string;
};

type PageContent = {
  version: 1;
  layout: null;
  blocks: PageBlockNode[];
};
```

Notes:
- Keep `id` on the reference node so the page editor can still reorder and remove nodes deterministically.
- Use a distinct `type: 'reusable'` sentinel so references are explicit and cannot be confused with code-defined inline block types.
- The top-level page block list should allow both inline block nodes and reusable references.
- Nested `blocks` fields should continue to allow only inline block instances in the first iteration.

# Why top-level only in the first iteration
- It keeps the initial implementation smaller and avoids mixing reusable references into every nested `allowedTypes` rule immediately.
- It avoids recursive validation and editor complexity where referenced content and nested inline blocks coexist arbitrarily deep.
- It still unlocks the main product value of reusing shared sections across pages.

# Editor UX
On the page edit screen:
- Keep the existing inline block picker for top-level blocks.
- Add a second control next to it for `Add reusable block`.
- That control should list existing reusable blocks by name plus block type badge.
- In the page content list, render reusable references as cards distinct from inline blocks:
  - show the reusable block name
  - show its underlying reusable block type badge
  - show that it is a live reusable reference
  - allow reorder and remove
  - include a link to edit the reusable block on `/blocks/[id]`
- If the referenced reusable block no longer exists, show a clear invalid-reference error and block save until removed or replaced.

# Data loading and save behavior
- The page edit loader should fetch reusable blocks alongside the current draft page content.
- The client editor state should preserve reusable reference nodes exactly as selected.
- Save the full `page_versions.content` JSON through the existing page edit action, including reference nodes.
- Validation should reject:
  - missing `reusableBlockId`
  - references to nonexistent reusable blocks
  - any reusable reference nested inside a `blocks` field

# Validation rules
- Inline block nodes continue using the existing registry-based validation.
- A reusable reference node is valid only when:
  - `type === 'reusable'`
  - `id` is a non-empty string
  - `reusableBlockId` is a non-empty string
  - the referenced reusable block exists at validation time
- Top-level `content.blocks` may mix inline blocks and reusable references.
- Nested `blocks` field arrays may contain only inline blocks in the first iteration.

# Implementation plan after approval
1. Extend the shared page content types and parse/serialize validation to support reusable reference nodes at the top level.
2. Extend the page edit loader/action to load reusable block options and validate referenced ids on save.
3. Update the page editor helpers and UI to add/remove/reorder reusable reference nodes alongside inline blocks.
4. Render reusable reference cards with clear labeling and a link to the reusable block editor.
5. Add regression tests for mixed content, invalid deleted references, and rejection of nested reusable references.
6. Update CMS documentation for the page editor and page content model.

# Review points
- Use live references, not snapshots, in the first iteration.
- Limit reusable references to the top-level page block list for the first implementation.
- Do not allow inline editing of reusable block content from the page editor.

# Open questions
- Should the page editor show a read-only preview summary of the referenced reusable block content, or just name/type metadata in the first pass?
- When a referenced reusable block is deleted later, should page saves be blocked immediately until the reference is removed, or should the page keep a soft-invalid state that can still save unrelated edits?

# Risks
- Live references make page drafts sensitive to later reusable block edits until reusable block versioning exists.
- Mixed top-level node types will require careful updates to page-content parsing and editor helpers to avoid regressions.
- Editors may expect nested reusable references once top-level references exist, so the first-iteration limit needs to be explicit in the UI and docs.

# Follow-ups
- Add reusable block draft/publish workflow so shared content can participate in safer page publishing semantics.
- Consider nested reusable references after top-level references are stable and the UX proves worthwhile.
- Consider read-only previews or change indicators for referenced reusable blocks if editors need more confidence.

# Recommendation
- Review and approve this design before implementation.
- If approved, implement top-level live reusable block references in the page editor without attempting snapshot semantics or nested references yet.
