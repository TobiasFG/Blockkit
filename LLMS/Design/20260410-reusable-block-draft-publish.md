Purpose: define a draft/publish workflow for reusable blocks so shared content can be edited safely without immediately changing live page references.

# Goal
- Give reusable blocks the same broad draft-versus-published safety model that pages already use.
- Let editors make draft changes to a reusable block without affecting pages that currently render the published version.
- Keep the first version small enough to fit the existing CMS while still establishing the right storage and publish semantics for future frontend rendering.

# Scope
- Define the reusable-block version data model and status lifecycle.
- Define how page reusable-block references should resolve while reusable blocks have drafts.
- Define the minimum CMS editor changes needed to save drafts and publish reusable blocks.
- Define migration and validation expectations for moving from single-record reusable blocks to versioned reusable blocks.

# Non-goals
- Do not add full reusable-block history browsing, diffing, or rollback UI in this slice.
- Do not redesign page publishing in the same change.
- Do not add snapshot semantics for page reusable-block references.
- Do not add nested reusable-block references or other new content-model capabilities here.

# Existing context
- Pages already use `page_versions` plus `pages.draft_version_id` and `pages.published_version_id` to separate editable draft state from live published state.
- Reusable blocks currently store a single live record in `reusable_blocks.content`, so editing a reusable block immediately changes every page that references it.
- The page-content model already stores live reusable-block references at the top level.
- The reusable block library and editor already exist, including nested block editing inside reusable block content.

# Problem
The current reusable-block model makes shared-content editing unsafe:
- there is no way to prepare reusable-block changes before publishing them
- page drafts and already-published pages both point at the same mutable reusable-block content
- editors cannot reason clearly about what is live versus what is still being prepared

That mismatch was acceptable for the first iteration, but now that pages can reference reusable blocks, the missing publish boundary is a real content-governance gap.

# Decision
Version reusable blocks and resolve page references to the published reusable-block version outside reusable-block editing flows.

This means:
- reusable blocks get a stable top-level identity plus separate draft and published versions
- the reusable block editor loads and saves the current draft version
- publishing a reusable block creates a new published version from the current draft
- page references continue to point at the stable reusable block id, not a specific version id
- when page content or frontend rendering resolves a reusable block reference, it should use the reusable block's published version by default

# Why published resolution is the default
- It matches editor expectations for what "published" means.
- It prevents reusable-block draft edits from leaking into already-published pages.
- It keeps page content references stable because they do not need to be rewritten on every reusable-block publish.

Tradeoff:
- A page draft that contains a reusable-block reference will still show the currently published reusable-block content unless the CMS explicitly chooses to preview draft reusable-block state in that editing context.
- That tradeoff is acceptable for the first implementation because it preserves safe publish semantics and avoids coupling page drafts to arbitrary reusable-block drafts.

# Proposed data model
Keep `reusable_blocks` as the stable entity record and move editable content into a new `reusable_block_versions` table.

```ts
type ReusableBlock = {
  id: string;
  name: string;
  folderId: string | null;
  blockType: string;
  draftVersionId: string | null;
  publishedVersionId: string | null;
  createdAt: string;
  updatedAt: string;
};

type ReusableBlockVersionStatus = 'draft' | 'published' | 'archived';

type ReusableBlockVersion = {
  id: string;
  reusableBlockId: string;
  status: ReusableBlockVersionStatus;
  content: BlockInstance;
  parentId: string | null;
  revision: number;
  createdAt: string;
  publishedAt: string | null;
};
```

Notes:
- `name`, `folderId`, and `blockType` remain on `reusable_blocks` because they describe the reusable block identity in the library, not one specific version.
- `content` moves out of `reusable_blocks` and into `reusable_block_versions`.
- Revisions should be monotonic per reusable block, matching the existing page-version pattern closely enough that the workflow stays predictable.

# Initial migration behavior
For every existing row in `reusable_blocks`:
1. Keep the row as the stable reusable-block identity.
2. Create one `reusable_block_versions` row from the current `content`.
3. Mark that initial version as both `draft` and `published` by creating:
   - one draft row
   - one published row copied from the same content
4. Set `reusable_blocks.draft_version_id` and `reusable_blocks.published_version_id` accordingly.

Reasoning:
- Reusing the page model avoids a special-case "shared initial row" state.
- Creating both versions preserves current behavior while establishing a clean transition to future draft edits.

# Save and publish semantics
## Save draft
- Saving the reusable block editor should create a new draft version row and archive the previous draft row.
- Saving a draft should not change the published version pointer.
- Validation should run against the draft payload before insertion, using the same block registry rules as today.

## Publish
- Publishing should copy the current draft version into a new published version row and archive the previous published row.
- The reusable block's `published_version_id` should update atomically with the publish operation.
- Publish should fail if no draft exists or if the draft content is invalid.

## Delete
- Deleting a reusable block should continue deleting the reusable block identity and all of its versions.
- Existing page-reference cleanup behavior should remain intact, but the lookup should operate through the stable reusable block id, not version ids.

# CMS behavior
## Reusable block editor
- Load the current draft version content into `/blocks/[id]`.
- Keep the current editing experience for fields and nested blocks, but label the form clearly as editing the draft.
- Add a `Publish` action next to the existing save behavior.
- Show basic state metadata:
  - current draft revision
  - whether unpublished changes exist relative to the published version
  - last published timestamp when available

## Reusable block library
- Sidebar and listing views continue to show reusable blocks by stable identity.
- No version rows appear directly in the sidebar.
- The first implementation does not need a separate history screen.

## Page editor and frontend resolution
- Reusable block references in page content keep storing `reusableBlockId`.
- Any UI that resolves a reusable-block reference for non-reusable-block-editing contexts should read from `published_version_id`.
- Missing published versions should be treated as invalid references for rendered/live contexts.

# Draft visibility decision
In the first implementation, the page editor should continue showing reusable-block references as metadata cards only, not inline rendered previews.

Why:
- The current page editor does not render full live block previews anyway.
- Showing rendered draft-versus-published differences would expand the scope sharply.
- It avoids an immediate design decision about whether page drafts should preview reusable-block drafts.

# Database shape
Recommended schema changes:
- alter `reusable_blocks` to add `draft_version_id uuid null` and `published_version_id uuid null`
- create `reusable_block_versions`
- eventually drop `reusable_blocks.content` after migration code and app reads have switched

Recommended `reusable_block_versions` fields:
- `id`
- `reusable_block_id`
- `status`
- `content`
- `parent_id`
- `revision`
- `created_at`
- `published_at`
- optional `created_by` if the project wants parity with page version auditing

Recommended constraints:
- one draft version per reusable block
- at most one published version per reusable block
- unique `(reusable_block_id, revision)`

Recommended helper functions:
- `save_reusable_block_draft(_reusable_block_id uuid, _content jsonb, _created_by uuid default auth.uid())`
- `publish_reusable_block(_reusable_block_id uuid, _created_by uuid default auth.uid())`

These should follow the same locking pattern as page draft/publish helpers to avoid concurrent publish/save races.

# Implementation plan after approval
1. Add the new version table, reusable-block pointers, indexes, and migration/backfill for existing rows.
2. Add SQL helpers or server-side transactional helpers for save-draft and publish operations.
3. Update reusable-block server types and loaders so the editor reads draft content and reference resolution reads published content.
4. Update the reusable block editor UI to expose draft save and publish states.
5. Update page/reference lookup helpers to resolve published reusable-block content where content expansion is needed.
6. Add regression tests for migration/backfill, draft saves, publishes, and invalid/missing published references.
7. Update reusable-block CMS documentation to describe the new workflow.

# Review points
- Reusable block references should continue storing stable reusable block ids, not version ids. - ok
- Published reusable-block content should be the default resolution target outside the reusable-block editor. - ok
- The first implementation should add save-draft and publish actions without adding full version-history UI. - ok

# Open questions
- Should a newly created reusable block start with both draft and published versions immediately, or should it remain unpublished until the first explicit publish? - remain unpublished until first explicit publish.
- Should page drafts ever preview reusable-block draft content when edited by the same user, or should page editing always resolve published reusable-block content until a later preview feature exists? published for now.
- Does the CMS need an explicit unpublished badge in the sidebar/library list for reusable blocks with draft changes? would be nice.

Proposed defaults for review:
- New reusable blocks should start with a draft version only and be clearly marked unpublished until the first explicit publish.
- Page editing should resolve published reusable-block content only in the first implementation.
- The library should show a lightweight unpublished-changes indicator, but not a full history UI.

# Risks
- Migrating existing reusable blocks from a single-record model to a versioned model needs careful backfill to avoid broken page references or editor loads.
- If server helpers resolve draft content in some places and published content in others without clear rules, editors will see inconsistent behavior.
- Publishing reusable blocks independently from pages can still create coordination questions for pages that rely on multiple shared blocks changing together.

# Follow-ups
- Add reusable-block history browsing and rollback once draft/publish semantics are stable.
- Add explicit preview controls if editors need to inspect page drafts against reusable-block drafts before publish.
- Consider change summaries or dependency warnings when publishing a reusable block that is referenced by many pages.

# Recommendation
- Review this design before implementation.
- If approved, implement reusable-block versioning by mirroring the page-version workflow closely, while keeping reusable-block references stable at the block identity level.
- Resolve the open questions above before coding, because they affect migration behavior, initial publishing state, and editor expectations.
