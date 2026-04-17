Purpose: replace manual full-path page slug editing with parent-based, fully versioned page identity so title, parent, URL segment, content, and SEO can all exist as draft state now and support scheduled publishing later.

# Problem
- Pages currently store one unique live `pages.slug` field with full route path like `/about/us/open-position`.
- Current create/edit flows force editors to type or maintain full path strings manually.
- Page title lives on `pages`, while content and SEO live in `page_versions`, so page identity already bypasses draft/publish.
- Scheduled publishing later needs one coherent versioned page model, not split live identity plus draft-only content.
- Sidebar hierarchy is inferred from slash segments instead of explicit parent relationships.

# Goals
- Make page hierarchy explicit with required parent selection for non-root pages.
- Require page title, allow optional URL-name override, derive full route path automatically.
- Make page identity versioned with draft/publish, alongside content and SEO.
- Keep one publish unit for all editor-visible page state.
- Make later scheduled publishing possible without another model rewrite.
- Warn editors when page rename/move changes descendant URLs.

# Non-goals
- No scheduled publish UI in this slice.
- No redirect/history system for old URLs in this slice.
- No localization or per-locale URL names.
- No drag/drop page-tree reparenting in this slice.
- No trash/restore workflow in this design.

# Current model
- `public.pages` stores `id`, `title`, `slug`, timestamps, and version pointers.
- `public.page_versions` stores `content`, `meta`, revision pointers, timestamps, and publish state.
- Dashboard create form asks for title plus slug/path.
- Sidebar tree derives hierarchy from `slug`.
- Edit route lookup uses live slug/path instead of stable page id.
- Publishing page content still leaves title/slug outside version model.

# Proposed model
## Split stable page record from versioned page identity
Keep `public.pages` as stable shell only:
- `id`
- `created_at`
- `updated_at`
- `draft_version_id`
- `published_version_id`

Move editor-visible page identity into `public.page_versions`:
- `title text not null`
- `parent_page_id uuid null references public.pages(id) on delete restrict`
- `url_name text null`
- `path_segment text null`
- existing `content`
- existing `meta`
- existing revision/publish fields

Root page version:
- `parent_page_id = null`
- `url_name = null`
- `path_segment = null`
- full path `/`

Non-root page version:
- `parent_page_id` required
- `url_name` optional
- `path_segment` required after normalization

# Why parent links target stable page ids
Parent link should point to `pages.id`, not `page_versions.id`.

Reason:
- editor always edits draft for one stable page shell
- child publish must still work even when parent has separate draft identity
- same child draft can resolve against parent draft graph for preview and parent published graph for live publish
- avoids blocking child publish when parent has unpublished move/rename

Tradeoff:
- path computation must resolve parent page through chosen graph:
  - draft path uses parent page's draft version
  - live path uses parent page's published version

# Versioned identity fields
## `url_name`
- optional editor override
- if blank, segment derives from title

## `path_segment`
- normalized final segment used in routes
- equals normalized `url_name` when override exists
- else derived from normalized title
- stored, not computed ad hoc, so uniqueness and route resolution stay cheap

## `title`
- versioned field
- publish changes visible title with page publish

# Derived full path
- Full path remains computed from version graph, not stored as source of truth.
- Parent relation source is stable page graph via `parent_page_id`.
- Build by joining ancestor `path_segment` values from root to current version.
- Root path always `/`.

# Uniqueness model
- Need unique sibling `path_segment` values within same parent version context.
- Need unique sibling `path_segment` values within same parent page context.
- Published tree uniqueness must be enforced for published versions.
- Draft tree uniqueness must be enforced for draft siblings under same draft parent.

Recommended rule:
- unique index on `(status, parent_page_id, path_segment)` for non-null `path_segment`

Reason:
- draft and published trees are separate graphs
- same page can legitimately have different draft and published paths at once
- siblings inside one graph still must not collide

Constraint note:
- root rows use `path_segment = null`, so separate root invariant still needed
- enforce one published root and one draft root through app validation for this slice

# Parent/version graph rules
- Draft page version references stable parent page or null for root.
- Published page version references stable parent page or null for root.
- Root page remains single top ancestor.
- All non-root pages must have parent page set.
- Page cannot become its own ancestor.

# Publish semantics
## Required outcome
Publish must make page identity, content, and SEO go live together.

## Child publish behavior
Child publish must remain allowed even if parent has unpublished draft changes.

Rule:
- publishing a page always publishes that page's draft identity/content/meta
- published full path resolves through current published parent versions
- draft full path resolves through current draft parent versions

Result:
- child content or child own URL-name/title changes can go live
- unpublished parent move/rename does not leak live
- live child remains under live parent path until parent itself publishes

## Publish flow
1. Load current draft page version.
2. Validate draft identity/content/meta.
3. Resolve draft parent page and current published parent page.
4. Create new published page version copying draft identity/content/meta, keeping `parent_page_id` stable.
6. Point `pages.published_version_id` to new published version.
7. Create fresh clean draft cloned from published version, keeping same `parent_page_id`, so editor returns to clean draft state.
8. Point `pages.draft_version_id` to clean draft clone.

This keeps:
- published graph pure
- draft graph editable
- post-publish page clean

# Create flow
## Data entry
- `Title` required
- `Parent page` required for non-root pages, default root
- `URL name` optional
- computed `Page path` preview

## Save behavior
- Create `pages` row shell first.
- Create initial draft page version with title/parent/url/path/content/meta defaults.
- Root page special-case remains single root shell/version.
- New page stays unpublished until explicit publish.

# Edit flow
## Identity tab
- Replace slug field with:
  - `Title`
  - `Parent page`
  - `URL name`
  - computed `Page path`
- Changing title/parent/url updates preview from draft graph only.
- Show inline warning when change alters descendant URLs:
  - `Moving or renaming this page changes child page URLs when published.`

## Root page
- parent locked
- URL name hidden/disabled
- path preview `/`

# Dashboard and sidebar
## Draft vs live display
Need explicit choice of which graph each CMS surface shows.

Recommendation:
- CMS editor surfaces show draft graph by default because editors work on draft state.
- Publish-status badge still shows whether draft differs from live.
- Metadata line can show current live path when page has unpublished identity changes.

Example row:
- primary path preview = draft path
- secondary badge = `Draft changes`
- optional note = `Live path: /about/team`

Why:
- editors need to see where draft intends page to land
- avoids hiding moved draft pages in old live tree while editing

# Routing and lookup
## Frontend live routing
- frontend public routes must resolve against published graph only
- draft graph never affects public page lookup

## CMS edit routing
Current `/edit/[...slug]` route becomes fragile once draft path can differ from live path.

Recommendation:
- switch CMS edit route to stable page id in this same feature
- route shape: `/edit/page/[id]`

Reason:
- avoids broken editor URLs after draft path changes
- decouples CMS navigation from draft/live path disagreement
- simpler scheduled-publish foundation

This is material scope increase but necessary for clean versioned identity model.

# Server changes
- Replace slug helpers with page-identity helpers:
  - normalize URL-name override
  - derive fallback segment from title
  - compute full path from chosen version graph by resolving parent page to draft or published version
  - detect descendant path changes
  - validate parent selection and cycle prevention
- Update `Page` and `PageDraftVersion` types:
  - `Page` = shell + draft/live computed summaries
  - `PageDraftVersion` = identity + content + meta + graph pointers
- Update page controller paths:
  - create page shell + initial draft version
  - save draft identity/content/meta to current draft version
  - publish using version-aware parent validation
  - delete by page id
  - fetch pages with both draft and published computed paths

# Validation rules
- Title required.
- Single root page only.
- Non-root pages require parent.
- URL-name override, when present, uses segment charset only, not slash-separated path.
- Effective `path_segment` cannot be empty for non-root pages.
- Sibling `path_segment` unique within same graph/status.
- Parent chosen for draft save must be existing page id.
- Page cannot set parent to self or any descendant in same graph.

# Schema impact
## Pages table
- remove `title`
- remove `slug`
- keep only shell columns + version pointers + timestamps

## Page_versions table
- add `title`
- add `parent_page_id`
- add `url_name`
- add `path_segment`

## Helper functions
- existing publish helpers likely need rewrite because page identity now belongs to version rows
- any code assuming `pages.slug` or `pages.title` must move to computed draft/live summaries

# Open questions
- Should draft tree show pages whose parent change would move them outside currently expanded branch in sidebar, or should sidebar auto-open affected ancestors? Recommendation: auto-open active draft ancestors.
- When child publishes under unchanged live parent while parent draft path differs, should UI show explicit notice that live path still follows published parent? Recommendation: yes.

# Review points
- Approved: single root page.
- Approved: inline warning enough for descendant URL impact.
- Approved: switch CMS edit route from slug-based to id-based as part of this feature.
- Approved: child publish remains allowed even when parent has unpublished draft changes.

# Risks
- This change touches schema, page routing, editor route structure, sidebar tree, dashboard create/edit/delete flow, publish logic, and all page docs at once.
- Path resolution now depends on resolving stable parent links through draft vs published graphs correctly.
- Existing SQL publish helpers may be easier to replace than retrofit.
- Moving CMS edit routes to ids may ripple through tests and deep links.

# Follow-ups
- Scheduled publishing on top of versioned page identity.
- Redirect/history records when published path changes.
- Multi-page publish dependency handling for parent/child identity changes.
- Potential bulk publish of subtree when parent move/rename should include descendants.

# Proposed rollout
1. Move page identity fields from `pages` into `page_versions`.
2. Change CMS page editing routes from path-based to id-based.
3. Add version-graph helpers for draft and published path computation.
4. Update dashboard/sidebar/editor to use draft graph plus live-path metadata.
5. Rewrite page save/publish helpers around versioned identity.
6. Update docs after implementation.
