Purpose: define page-level SEO metadata support before implementation.

# Goal
- Add default SEO fields to pages beyond the existing page title.
- Store SEO metadata with the draft/published page version rather than on the top-level `pages` row.
- Expose the fields in the CMS edit page so editors can manage them alongside other page settings.

# Scope
- Add typed SEO metadata to page-version reads and writes.
- Extend the CMS page edit screen with an SEO section.
- Prepare the data model so frontend routes can later render `<title>` and related meta tags from published page data.

# Non-goals
- Do not build a full SEO analysis tool or validation service.
- Do not add per-block SEO controls.
- Do not redesign the broader content editing flow in this change.

# Why Versioned Metadata
- The database already has `page_versions.meta jsonb` for page metadata.
- SEO data should draft and publish with page content.
- Keeping SEO on `page_versions` avoids splitting page state across `pages` columns and version metadata.

# Proposed metadata shape
Use a typed SEO object inside `page_versions.meta`.

```ts
type PageSeoMeta = {
  title?: string | null;
  description?: string | null;
  canonicalUrl?: string | null;
  ogImageUrl?: string | null;
  noIndex?: boolean;
  noFollow?: boolean;
};
```

Store it under `meta.seo`.

```json
{
  "seo": {
    "title": "About Blockkit",
    "description": "Learn about Blockkit and the team behind it.",
    "canonicalUrl": "https://example.com/about",
    "ogImageUrl": "https://example.com/og/about.png",
    "noIndex": false,
    "noFollow": false
  }
}
```

# Initial editor fields
- SEO title
- Meta description
- Canonical URL
- Open Graph image URL
- No index
- No follow

# Behavior
- Keep `pages.title` as the CMS page label and default user-facing page name.
- SEO title is optional. If empty, frontend metadata should fall back to `pages.title`.
- Meta description is optional.
- Canonical URL and Open Graph image URL are optional URL fields.
- `noIndex` and `noFollow` default to `false`.

# Data access changes
- Add a typed page-version read shape that includes the current draft version metadata for the edit screen.
- Add a write path for updating draft metadata without requiring the full content editor to exist yet.
- If the current draft metadata is missing a `seo` object, treat it as empty defaults in the UI.

# CMS edit page changes
- Keep the current page details section for title and slug.
- Add a second section for SEO metadata.
- Save title and SEO metadata together from the same form submit.
- Continue to show slug as read-only.

# Open question
- The repo already has SQL functions for revisioned draft saves and publish, but the current app updates `pages.title` directly and does not yet use the page-version write flow.
- Implementation should decide between:
  1. A minimal interim path that updates `pages.title` and the current draft version metadata in one action.
  2. A larger alignment change that moves edit-page saves onto the revisioned draft workflow now.

Recommendation: choose option 1 for this feature unless draft revision history is being implemented in the same work. It keeps scope smaller while still storing SEO in the correct place.

# Implementation notes
- Add page-version server helpers for fetching the current draft version by page id.
- Add typed metadata parsing/serialization helpers so the UI does not work with raw `jsonb` objects.
- Avoid adding SEO columns to `public.pages`.
- Document the editor behavior in `docs/agents/workflows/page-editor.md` when implemented.
- Add or update tests around metadata parsing and edit-page saves if test coverage exists for this area.

# Risks
- Mixing `pages.title` writes with draft metadata writes can create partial-update behavior if not handled transactionally.
- If publish later copies metadata incorrectly, frontend SEO could diverge from draft expectations.
- URL validation rules that are too strict may block practical editorial input.

# Follow-up
- Render published SEO metadata in the frontend route `load` or page rendering layer.
- Align page editing with the existing draft/publish revision model.
- Consider social metadata beyond the initial fields if needed later.
