Purpose: define how code-defined block types become reusable block instances that editors can create, organize, and later attach to pages.

# Goal
- Let editors create many reusable instances from code-defined block types such as `hero`, `text`, or `section`.
- Show those reusable block instances in the CMS sidebar under a dedicated section next to Pages.
- Support folder-style organization so instances can be grouped without depending on page URL hierarchy.
- Keep block definitions in code while storing reusable block content and organization in the CMS data model.

# Scope
- Define the data model for reusable block instances and folders.
- Define how the sidebar should present block folders and instances.
- Define the minimum editor flows for creating, renaming, moving, and editing reusable block instances.
- Identify the backend and UI slices needed after design approval.

# Non-goals
- Do not replace page content blocks with references in this change unless explicitly designed later.
- Do not build a visual drag-and-drop tree editor in the first iteration.
- Do not add schema editing in the CMS; block definitions stay in application code.
- Do not design publishing/versioning behavior beyond draft editing for the initial slice.

# First-iteration decisions
To keep the first implementation small and reviewable, use these defaults unless the design is revised:
- Reusable block names do not need to be unique; they are human-friendly labels.
- Reusable blocks use a single editable record and do not get draft/published versions in the first iteration.
- Deleting a folder should require the folder to be empty in the first iteration.
- Pages do not reference reusable blocks yet; page integration is a separate follow-up.

# Problem
The current system has:
- code-defined block definitions in `src/lib/blocks/registry.ts`
- typed page content validation in `src/lib/pageContent.ts`
- a CMS sidebar that only shows real pages

What is missing:
- a way to create reusable content instances from those definitions
- a place in the CMS to organize those instances outside page URLs
- a clear path for later using those instances from pages

# Existing constraints
- Sidebar page navigation currently derives from `pages.slug` and only renders real pages.
- The edit page currently supports title and SEO only; content editing is still placeholder UI.
- Page content blocks are stored inline in `page_versions.content.blocks`.
- The current block system validates block instances against the code registry.

# Proposed model
Introduce reusable block library records stored separately from pages.

## Block folders
Folders provide sidebar grouping and simple organization.

```ts
type BlockFolder = {
  id: string;
  name: string;
  parentId: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};
```

Notes:
- `parentId: null` means a top-level folder inside the Blocks sidebar section.
- Folder nesting is explicit and independent from page slugs.
- Keep ordering simple with `sortOrder`.

## Reusable block entries
Each entry is an editor-created instance of a block definition.

```ts
type ReusableBlock = {
  id: string;
  name: string;
  folderId: string | null;
  blockType: string;
  content: BlockInstance;
  createdAt: string;
  updatedAt: string;
};
```

Notes:
- `blockType` must exist in the code registry.
- `content.type` must equal `blockType`.
- `content.id` remains the instance id used by the content parser.
- `name` is the label shown in the sidebar; it is separate from any block field like `heading`.

# Why separate records instead of storing reusable blocks as pages
- Reusable blocks are not pages and should not inherit page slug rules.
- Folder grouping should not depend on URL hierarchy.
- This keeps the page tree and block library conceptually distinct in both UI and storage.

# Sidebar behavior
Add a new top-level section named `Blocks` under the existing `Pages` section.

## Display rules
- Show folders as collapsible nodes.
- Show reusable blocks as leaf items inside their folder or at the section root when `folderId` is `null`.
- Display each block entry with its editor name and a smaller block type badge.
- Keep existing page navigation unchanged.

## Actions
- `New block` creates a reusable block entry by first choosing a registered block type.
- `New folder` creates a folder inside the current Blocks section or within another folder.
- Folder delete is allowed only when the folder has no child folders and no block entries.
- Folder and block collapse state is local UI state, matching the current page tree behavior.

# Editor flows
Start with one dedicated edit route for reusable blocks.

## Create block
1. User opens `New block`.
2. User selects a block type from the code registry.
3. System creates a draft block entry with generated ids and default field values.
4. User is routed to the block editor.

## Create folder
1. User opens `New folder`.
2. User enters a name and optional parent folder.
3. Folder appears in the Blocks sidebar immediately.

## Edit block
- Edit block name.
- Edit block fields using the same field definitions already used by the page content parser.
- Save updates to the reusable block record.

## Move block or folder
- First iteration can use a parent-folder select instead of drag and drop.
- Prevent moving a folder into itself or one of its descendants.

# Default values
Creating a reusable block needs deterministic starter content.

Recommended defaults by field type:
- `string`: `''`
- `date`: omit
- `number`: omit
- `boolean`: `false`
- `blocks`: `[]`

Required fields may still start empty for strings so the editor can validate before save.

# Routes
Recommended initial routes:
- `/blocks/[id]` for editing a reusable block

Keep folder management inline in the sidebar or in simple modal forms rather than separate pages.

# Documentation requirements after approval
Implementation should update the CMS docs in `LLMS/Documentation` as part of the same change.

Expected docs to create or update:
- document reusable block library behavior and constraints
- update sidebar documentation to include the new `Blocks` section
- update the documentation index if new docs are added

# Data validation
- Reuse `getBlockDefinition()` and the existing page-content validation rules for block field values.
- Add a helper that validates a single `BlockInstance` payload for reusable blocks.
- Reject writes when `blockType` is unknown or when `content.type` and `blockType` differ.

# Database shape
Recommended new tables:
- `block_folders`
- `reusable_blocks`

High-level fields:
- `block_folders`: `id`, `name`, `parent_id`, `sort_order`, timestamps
- `reusable_blocks`: `id`, `name`, `folder_id`, `block_type`, `content`, timestamps

Constraints:
- `reusable_blocks.content` should remain JSON and be validated in the application layer first.
- Foreign keys should cascade deletes from folders to child folders and either cascade or restrict deletes for contained blocks; prefer `set null` for block `folder_id` in the first iteration to reduce accidental data loss.

# Implementation plan after approval
1. Add database tables and typed server helpers for block folders and reusable blocks.
2. Add shared TypeScript types plus block default-value helpers.
3. Extend the CMS sidebar to render a separate block library tree with folders and block items.
4. Add block create/folder create actions.
5. Add a reusable block edit screen driven by the existing block registry.
6. Add tests for validation, tree building, and create/update flows.
7. Design a follow-up change for referencing reusable blocks from page content if that is still desired.

# Risks
- Reusable blocks may overlap conceptually with inline page blocks unless the UI clearly distinguishes them.
- Folder trees can introduce complexity in move/delete flows if cascading rules are not explicit.
- If reusable blocks are later referenced by pages, content publishing semantics will need a clear ownership model.

# Open questions
- Should reusable block names be unique within a folder, or only human-friendly labels?
- Should deleting a folder move child blocks to root, or require the folder to be empty?
- Should pages eventually embed snapshots of reusable blocks or references to live reusable blocks?
- Does the first iteration need draft/published versions for reusable blocks, or is a single editable record enough?

Proposed answers for review:
- Names should be human-friendly labels only in the first iteration.
- Folder delete should require the folder to be empty in the first iteration.
- Page integration should be deferred and designed separately after the library exists.
- A single editable record is enough for the first iteration.

# Recommendation
- Approve the reusable block library concept before implementation.
- Build the first slice around standalone reusable blocks plus folders in the sidebar.
- Defer page-to-block referencing until after the library workflow exists and is validated.
