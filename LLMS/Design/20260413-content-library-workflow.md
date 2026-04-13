Purpose: define shift from mixed page-inline block creation to single-source content creation in dedicated Content library.

# Summary
- Rename reusable block library to `Content`.
- Stop allowing new inline block creation inside page editor.
- Make page editing consume content from library by dragging or inserting library items into page content.
- When editor chooses to edit content already placed on page, route them to that content item's dedicated editor instead of editing block fields inline on page.

# Problem
- Current CMS supports two competing creation models:
  - create inline blocks directly inside page editor
  - create reusable blocks in library
- That split weakens shared-content workflow and teaches editors two mental models for same job.
- Page editor also mixes page composition with block authoring, which makes ownership unclear and encourages page-local content duplication.

# Goals
- One creation source: Content library only.
- Page editor becomes composition surface, not block-authoring surface.
- Rename UI and editor copy from `reusable blocks` / `library` to `Content` where this surface is user-facing.
- Keep page-level drag/drop workflow so adding content stays fast.
- Keep direct route from placed page content to content editor.

# Non-goals
- Do not change underlying content reference model from linked references to snapshots.
- Do not add nested content references inside reusable-content editors.
- Do not redesign content schema, draft/publish semantics, or page save endpoint.
- Do not remove folder support.

# Proposed Defaults
- Top-level page content list should contain linked Content references only after this change ships.
- Page editor should not expose `Add block…` controls for top-level page content.
- Do not add migration or backward-compat handling for older page-local inline blocks in this change; early development should favor clean replacement over legacy support.
- Content rows on page should navigate to `/content/[id]` when editor chooses edit action or clicks row-level edit affordance.
- Sidebar/library insertion should stay available as drag/drop on wide pointer layouts plus explicit action fallback.

# Interaction Model
1. Editor opens `Content` from sidebar or dashboard.
2. Editor creates folder or content item there.
3. Editor opens page editor.
4. Editor drags content item from sidebar Content tree into page content list, or uses insert action from same tree.
5. Page stores linked content reference.
6. If editor wants to change content item itself, page row sends them to content editor route for that item.

# Information Architecture
- Sidebar section label changes from `Blocks` to `Content`.
- Rename route from `/blocks` to `/content`.
- Dashboard entry and related helper copy should also use `Content`.
- Dedicated content editor route is `/content/[id]`.

# Page Editor UX
## Top-level content area
- Remove top-level inline block picker from page editor.
- Keep top-level insertion targets for dragging content references into page.
- Empty state should instruct editor to open `Content` and drag or insert from library.
- Existing referenced content rows should show:
  - content name
  - underlying block type
  - live-link status
  - action/link to edit content

## Nested block fields
- Nested block editing inside content-item editor remains allowed because content authoring now lives there.
- Page editor should not offer nested inline editing because page content is references-only at top level.

# Content Editor UX
- Rename user-facing copy from `Reusable block` to `Content` where practical in title, buttons, helper text, notices, and back links.
- Keep block-type, folder, draft/publish behavior intact.
- This remains place where primitive fields and nested block content are authored.

# Review Points
- Page editor should stop creating new top-level inline blocks.
- Content library becomes only creation path for block-based content.
- Editing placed content should navigate to content editor instead of inline page editing.
- User-facing IA should say `Content`, not `Blocks` / `Reusable blocks`, except technical route names left unchanged.

# Open Questions
- None. Route rename can stay out of scope by using copy-only rename now.

# Risks
- Existing dev content that still stores top-level inline blocks may look inconsistent until manually replaced.
- Route rename from `/blocks` to `/content` touches many links and active-state checks at once, so missed references could leave dead navigation.

# Follow-Ups
- Audit docs and component names later if code-level `reusable block` terminology becomes maintenance noise.

# Implementation Plan After Approval
1. Update sidebar, dashboard, library route, content editor, page editor, and helper copy to use `Content`, including `/content` route rename.
2. Remove top-level inline block creation controls from page editor and retune empty-state guidance around library insertion.
3. Keep drag/drop + action-based insertion from sidebar Content tree into page content list.
4. Change page-content row affordances so linked content rows navigate to dedicated content editor when editor chooses edit.
5. Keep page-content model and validation focused on linked content references for new editing flow.
6. Update CMS docs for dashboard, edit page, reusable-block-library doc, sidebar nav, and docs index wording as needed.

# Recommendation
- Review and approve this design before implementation.
- After approval, implement workflow shift without route rename or data migration in first pass.
