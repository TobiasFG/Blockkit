Purpose: define a coordinated UI refresh for CMS dashboard and content editor so they match the calmer, more coherent direction established by the rebuilt page editor.

# Summary
- Refresh `/` dashboard and `/content/[id]` editor to feel like part of same refined editing workspace as `/edit/[...slug]`.
- Keep existing workflows, loaders, actions, draft/publish behavior, and content model intact.
- Reduce scaffold-like card stacking, tighten hierarchy, and give status/actions stable, quieter homes.

# Problem
- Dashboard still feels heavier and more promotional than the newer page editor, with a dramatic hero that competes with daily work instead of calmly framing it.
- Content editor still reads like older admin scaffolding: one large container, many repeated inset boxes, and weaker separation between high-frequency editing and lower-frequency metadata/state.
- Together they make CMS feel visually inconsistent, even though edit page already established a stronger product direction.

# Goals
- Align dashboard and content editor with current CMS visual direction and page-editor shell.
- Make daily editing feel faster to scan and less card-heavy.
- Preserve page-first emphasis on dashboard while keeping Content library clearly secondary.
- Give content editor the same “main workspace + calmer secondary state region” feel as page editor.
- Keep save/publish/status feedback visible without letting status chrome dominate form flow.

# Non-goals
- Do not change route structure, data shape, sorting logic, save/publish semantics, or modal flows.
- Do not redesign sidebar information architecture in this change.
- Do not add new dashboard capabilities beyond presentation and copy/layout refinements.
- Do not change nested block editing behavior beyond shell-level styling needed for coherence.

# Users and context
- Primary users: content managers updating pages and shared content during routine editorial work.
- Secondary users: marketers checking SEO/publishing readiness and developers sanity-checking content structure.
- Context: focused day-to-day editing sessions where users want confidence, speed, and low visual noise.

# Design direction
- Tone: editorial utility, same as rebuilt page editor.
- Personality: fast, efficient, understandable.
- Visual stance: light-first workspace with warm-neutral tinting, calmer surfaces, quieter metadata, and stronger hierarchy from layout/typography instead of dramatic hero treatments.
- Memorable idea: the CMS should feel like one consistent workbench, not separate admin pages designed at different maturity levels.

# Proposed UX
## Dashboard
- Remove current dark, marketing-like hero treatment.
- Replace it with a calmer top region:
  - short eyebrow
  - direct heading
  - one-sentence guidance
  - compact summary metrics integrated into layout instead of framed as hero stats
- Keep page list as dominant surface, with flatter rows and lighter separators rather than mini-card repetition.
- Keep create-page form nearby, but make it feel like focused utility module rather than a separate feature card.
- Keep Content library entry present but secondary: one restrained summary/action region, not co-equal with page work.

## Content editor
- Rebuild `/content/[id]` into two-region shell on wide screens:
  - main column for name, folder, primary fields, nested content editing
  - secondary aside for status, publish/save actions, timestamps, and type metadata
- Move publish state and timestamps into persistent side rail so main editing flow starts with editable fields immediately.
- Keep content fields visually primary and reduce nested surface repetition around them.
- Keep save draft and publish actions stable in one action cluster; do not duplicate controls.
- Preserve top-level “back to Content” navigation but quiet it visually.

## Shared patterns
- Reuse page-editor conventions where practical:
  - tighter section spacing
  - fewer large cards
  - softer inset surfaces
  - calm uppercase metadata
  - stable feedback near action cluster
- Use icon buttons only where action is already obvious and compact; keep explicit text for destructive or state-changing actions like Publish/Delete.

# Layout strategy
## Dashboard layout
- Wide screens: two-column top composition with page-work intro on left and compact operational summary/create tools on right, followed by full-width page list.
- Smaller screens: stack intro, summary, create form, then page list without changing priority.
- Page rows should feel list-like and editorial, not dashboard-card-like.

## Content editor layout
- Wide screens: `main + aside` similar to edit page, with main content column noticeably wider.
- Smaller screens: stack action/status panel before metadata details, keep fields immediately after top title block.
- Nested `BlockListEditor` remains in main column; wrapper styling should integrate with new shell instead of adding extra visual weight.

# Key states
## Dashboard
- Default: draft-first list, create form ready, content summary secondary.
- Empty pages: calm empty state that directs user to create first page without oversized illustration/hero tone.
- Create success/error: message near create form, stable layout.
- Delete pending: only affected row/action should show pending state.

## Content editor
- Default: current content metadata visible, main fields editable, action rail persistent.
- Unpublished: state shown in side rail without alarming tone.
- Draft changes: visible in side rail and action cluster.
- Validation errors: appear inline in fields plus short summary near actions.
- Save success/error: feedback near actions, not above entire form.
- Publish pending: publish control reflects pending state without moving layout.

# Interaction model
- Dashboard entry should answer “what needs attention?” immediately.
- Editing actions on dashboard stay edge-aligned and easy to scan.
- Content editor should feel like working from top to bottom in main column while action/state awareness stays peripheral but visible.
- Publish/save remain deliberate button actions with immediate local feedback.
- Drag/drop and row actions inside nested content editing stay unchanged functionally.

# Content requirements
- Dashboard copy should stay terse and editorial, not promotional.
- Metrics labels should describe current workload, not product value.
- Content editor helper copy should focus on what editor can change now, not implementation model.
- Publish/draft state text should reassure rather than dramatize.

# Review points
- Dashboard should drop dark hero and adopt calmer workspace framing.
- Dashboard should remain page-first, with Content library clearly secondary.
- Content editor should mirror edit-page shell with main editing column plus secondary state/actions rail.
- This pass should prioritize visual/system consistency over adding new capabilities.

# Open questions
- None. Existing CMS direction plus defaults above should be enough for first pass.

# Risks
- If dashboard becomes too quiet, page creation may feel hidden; balance emphasis carefully.
- If content editor rail grows too dense, it could recreate same clutter this change aims to remove.
- Reusing page-editor direction too literally could ignore workflow differences between page editing and content-item editing; implementation should adapt pattern, not clone it.

# Follow-ups
- After implementation, update CMS docs to capture shared editor-shell conventions across page and content editors.
- If broader CMS visual-system work continues, extract shared shell primitives/tokens from dashboard, page editor, and content editor.

# Recommendation
- Review and approve this design before implementation.
- After approval, implement dashboard and content-editor refresh together so CMS visual language advances as one pass instead of drifting route by route.
