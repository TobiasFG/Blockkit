Purpose: establish a stronger visual direction for the CMS before larger structural and UI changes continue.

# Feature Summary
The current CMS intentionally operates at a scaffold level. It is usable enough for implementation progress, but it does not yet express a deliberate visual system across the dashboard, sidebar, page editor, and reusable-block editor. A clearer visual direction is needed so upcoming feature work does not keep layering tactical styling decisions on top of a temporary look.

This design sets visual defaults and review questions, not final implementation details.

# Primary User Action
- Understand the CMS as a fast, calm, structure-first editing environment where hierarchy and system state are immediately legible.

# Visual Direction
- Tone: utilitarian, subtle, refined.
- Theme support: light and dark mode must both feel designed, not like one primary mode plus a weak inversion.
- Hierarchy: rely on typography, spacing, surface contrast, and restrained accent use rather than ornamental effects.
- Identity: the interface should feel more considered than stock admin scaffolding, but still controlled and practical.

# Proposed Defaults
- Build around a small surface vocabulary: app background, primary content surface, inset secondary surface, elevated transient surface.
- Use one restrained accent family for active/navigation emphasis and status colors only where semantics require them.
- Favor flatter list and panel treatments over repeated standalone cards.
- Keep motion subtle and state-driven, with reduced-motion support treated as a first-class constraint.
- Define shared heading, body, metadata, and mono/status text treatments before more page-specific styling work lands.
- Push hierarchy more assertively than the current scaffold through typography scale, layout weighting, and surface contrast while staying editor-first rather than decorative.

# Review Points
- The visual system should be assertive within the utilitarian/subtle direction.
- Decide whether the CMS should feel closer to an editorial workspace, an operations console, or a hybrid of the two.
- Decide how dark mode should express depth and focus without defaulting to generic dark-admin styling.

# Open Questions
- Should the dashboard and editors share exactly the same surface language, or should editors feel denser and more tool-like?
- Does the product want one accent color family across both page and reusable-block workflows, or distinct semantic accents by area?
- Should the sidebar visually recede more strongly so main editing surfaces carry the visual emphasis?

# Risks
- A visual-direction pass without structure approval could overfit styling to layouts that are about to move.
- If the design system remains too vague, future implementation work will still drift toward local one-off decisions.
- If the system becomes too assertive, it may conflict with the product goal of fast and understandable editing.

# Follow-Ups
- Once approved, use this direction to guide the dashboard workflow reframe and reusable-block-management redesign.
- Capture resulting tokens, theme rules, and surface patterns in CMS documentation after implementation starts.
- Use the approved direction as the baseline for future accessibility and reduced-motion audits.

# Approved Decisions
- Visual direction should be assertive rather than scaffold-like.
- Strong hierarchy should come from layout, typography, and surface contrast, not ornamental decoration.
