# Scope
- Page editor behavior, save/publish flow, sidebar insertion, page identity/path rules.

## Use When
- Touching `/edit/page/[id]`, page save/publish/revert logic, SEO fields, page path logic, page-content editing.

## Route
- Stable editor route: `/edit/page/[id]`.
- Do not route editor by mutable slug/path.

## Layout Invariants
- Main column owns editing work.
- Side rail owns draft/publish state and editor actions.
- Editor shell may evolve, but action-state meaning must stay clear and not be duplicated in multiple regions.

## Draft / Publish Contract
- Primary action is state-driven: save draft, publish saved draft, or block on validation.
- Idle no-op primary action should stay hidden.
- Secondary revert action targets current comparison source and stays hidden when no revert exists.
- Publish uses current saved draft only.
- After publish, create fresh clean draft clone from published revision.
- Save/publish feedback uses shared CMS toasts, not local banners.

## Identity Rules
- Root page:
  - always `/`
  - no parent edit
  - no URL-name edit
- Non-root page:
  - parent required
- `url_name` optional. Empty -> derive from title.
- Normalized segment may contain lowercase letters, numbers, dashes, underscores, periods, tildes.
- Identity changes on page with children should warn about descendant URL changes on publish.

## Content Rules
- Create/edit reusable content in `/content`, not inline inside page editor.
- Insert reusable content into page through shared insertion flows.
- Content references remain top-level only unless task explicitly changes model.
- Interaction affordance may vary by device; insertion path must stay available on touch/mobile.

## SEO Rules
- SEO data lives in `page_versions.meta.seo`.
- Saving from inactive tab must preserve current identity values.

## Verification
- Editor route stays `/edit/page/[id]`.
- Action states still match save draft, publish, validation-blocked, and revert contracts.
- Identity edits preserve root/non-root constraints and warn on descendant URL impact where required.
- Reusable content insertion path still works on both wide-pointer and touch/mobile flows.
