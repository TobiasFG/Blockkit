Purpose: define cleaner, more coherent rebuild of CMS page edit screen without changing underlying draft-save behavior or page-content model.

# Summary
- Rebuild `/edit/[...slug]` as focused editing workspace instead of one long stacked admin form.
- Keep existing save mechanics, draft validation, reusable-block insertion, page-content model intact.
- Make content editing primary surface, move lower-frequency metadata into calmer secondary region, give status/actions stable home.

# Problem
- Current page editor works, but still reads like one large card filled with smaller cards.
- Title, slug, SEO, content, timestamps, status, feedback, global actions compete visually even though editors use them at different frequencies.
- Recursive content editing is strong enough now that surrounding shell needs better hierarchy or whole screen feels heavy and generic.

# Goals
- Make page editor feel calm, fast, structurally obvious.
- Give page content clear primacy without hiding slug/SEO controls.
- Keep save state, validation state, recovery actions visible with less noise.
- Reduce repeated container chrome and generic admin styling.
- Preserve current behavior for save/reset/validation and reusable-block insertion.

# Non-goals
- Do not change page data shape, loaders, actions, or save endpoints.
- Do not redesign `BlockListEditor` internals beyond shell-level styling/hooks needed for cohesion.
- Do not add publish workflow, autosave, comments, or collaboration features.
- Do not change sidebar IA or reusable-block library behavior.

# Users and context
- Primary users: content managers updating page structure and copy inside CMS.
- Secondary users: marketers adjusting SEO metadata and developers checking content structure.
- Context: repeated day-to-day editing sessions where speed, clarity, confidence matter more than ornament.

# Design direction
- Tone: editorial utility.
- Theme: light-first, with soft tinted neutrals and restrained contrast rather than stark grayscale.
- Personality fit: fast, efficient, understandable.
- Memorable idea: clear “working desk” composition where page body is central, metadata sits in calm side rail, draft state behaves like persistent instrument panel instead of floating badge pile.

# Proposed UX
## Overall layout
- Use two-region shell on wide screens:
  - main column for page identity + content editor
  - secondary aside for status, save/reset actions, route info, timestamps, SEO controls
- Collapse to one column on smaller screens, but keep status/actions near top and SEO after content so editing priority stays intact.

## Header and status
- Replace current chip-heavy header with tighter top bar:
  - eyebrow label
  - page title
  - route display
  - compact draft/validation summary
- Keep save and reset actions in one persistent action cluster in sidebar/top area, not duplicated across page.
- Show validation summary as short structured message near actions, with stronger state color only when needed.

## Main content flow
- Lead with concise identity block:
  - title
  - slug
  - minimal helper copy
- Make content editor dominant immediately after identity fields.
- Reduce separate boxed sections around content; favor page-level spacing hierarchy over repeated card shells.

## Secondary metadata rail
- Move SEO controls into dedicated side-panel section labeled for discovery/share settings.
- Group timestamps and route details into compact information module below status/actions.
- Keep help copy terse and editor-facing.

## Feedback and recovery
- Inline success/error messages sit near persistent actions, not inside content flow.
- `Reset draft` remains available only when changes exist.
- Save button remains primary and visually stable; state changes should not shift layout.

# Visual system
## Typography
- Pair one sharper display face for headings with restrained sans for UI/body text.
- Keep product UI sizing fixed/rem-based, not fluid marketing scale.
- Increase contrast between page title, section labels, control text so hierarchy does more work than borders.

## Color
- Use light mode by default for editor daytime/admin usage.
- Palette should use warm-neutral or olive-neutral tinting rather than plain slate scaffolding.
- Accent reserved for interactive focus and state; success/warning/error colors appear only when state exists.

## Surfaces and spacing
- Favor open layout, dividers, sectional rhythm over stacked rounded cards.
- Allow one strong page shell and one calmer aside shell; avoid card-inside-card repetition.
- Keep content width comfortable for form editing while preserving readable line lengths.

# Interaction defaults
- Keep drag-and-drop behavior unchanged where already supported.
- Preserve current reusable-block insertion paths.
- Keep `Reset draft` conditional on unsaved changes.
- Preserve current client-side validation gate before save submit.

# Accessibility
- Maintain current keyboard and non-drag insertion paths.
- Preserve visible labels and helper text for form controls.
- Respect reduced motion with minimal or no decorative motion in first pass.
- Ensure state summary and inline errors retain sufficient contrast and semantic clarity.

# Implementation plan after approval
1. Refactor `src/routes/edit/[...slug]/+page.svelte` into new page shell with main/aside composition and consolidated action area.
2. Introduce page-scoped style tokens/classes for rebuilt layout and reduce repeated surface wrappers around form groups.
3. Adjust `BlockListEditor` invocation wrapper styling only as needed so content area fits new shell cleanly.
4. Update edit-page documentation to describe new layout and action placement.
5. Run `npm run check` and targeted tests if needed.

# Review points
- Put SEO in secondary side rail instead of inline before content.
- Keep content as primary region directly after page identity fields.
- Use light-first editorial utility direction, not dark or flashy treatment.

# Open questions
- None. Defaults above should be sufficient for first implementation pass.

# Risks
- If shell styling changes without light touch around `BlockListEditor`, nested editing may still visually overpower rest of page.
- Two-column layout can feel cramped if aside is too wide; composition needs careful width balance.
- Rebuilding one route in isolation may make rest of CMS feel visually behind until later passes.

# Follow-ups
- After rebuild lands, consider whether `BlockListEditor` itself needs dedicated visual pass for deeper cohesion.
- If broader CMS visual-direction work is approved later, align this editor with those tokens/patterns.

# Recommendation
- Review and approve this design before implementation.
- If approved, rebuild only edit page shell and supporting documentation in this change.
