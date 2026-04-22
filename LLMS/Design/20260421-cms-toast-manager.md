Purpose: replace repeated inline CMS action feedback with one shared toast system that gives editors cleaner, more consistent transient success/error messaging.

# Summary
- Add shared toast manager scoped from CMS layout, not process-global singleton.
- Replace route-local success/error banners used for transient action results with toast calls.
- Keep inline field validation and blocking errors in forms; use toasts for action outcome feedback like save, publish, create, delete, restore.

# Problem
- CMS routes repeat same local feedback pattern with route-specific `successMessage`, `errorMessage`, or `feedback` state.
- Current messages live in different places per screen, so publish/save/restore results do not feel consistent.
- Repeated inline banners add view noise and route code noise for feedback that should disappear after short time.
- Page editor already shows exact issue suggestion called out: publish/save messages live inline in side rail instead of clean transient toasts.

# Goals
- Give CMS one consistent action-feedback pattern for transient success/error messaging.
- Remove repeated route-local toast-like state from CMS pages where message does not need permanent layout space.
- Keep toast API simple enough for enhanced form actions and direct client-side events.
- Follow repo Svelte 5 shared-state guidance with context-scoped state and cleanup.

# Non-goals
- Do not replace inline field-level validation, modal copy, or persistent status chips.
- Do not add backend flash-message/session transport in this slice.
- Do not redesign auth flow unless same toast system can be adopted with near-zero extra work.
- Do not add undo actions, stacked promise toasts, or notification history in first slice.

# Current targets
- `/edit/page/[id]`
  - draft save success/error
  - publish success/error
  - client-side publish guard like `Save draft before publishing current page changes.`
- `/content/[id]`
  - draft save success/error
  - publish success/error
  - same client-side publish guard
- `/content`
  - create folder/block success/error
  - delete folder/block success/error
- `/trash`
  - restore page/content success/error

# Proposed UX
- Toast stack anchored in consistent CMS viewport corner on every non-auth CMS route.
- Success toast: brief, quiet, auto-dismiss.
- Error toast: more visible tone, longer auto-dismiss, manual dismiss available.
- Messages should stay terse and action-linked:
  - `Page draft saved.`
  - `Page published.`
  - `Failed to publish page: ...`
  - `Folder created.`
- Route layout should not reserve permanent space for transient success/error boxes once migrated.

# State and architecture
- Create feature package under `src/lib/Toasts/`.
- Use context-scoped class pattern from `docs/agents/conventions/svelte-state.md`.
- Provider lives in root CMS subtree so each app instance/request gets isolated state.
- State owns:
  - toast list
  - add/remove helpers
  - auto-dismiss timers
  - cleanup on destroy
- Expose minimal API:
  - `success(message: string, options?)`
  - `error(message: string, options?)`
  - optional base `show(...)`
- Toast rendering component reads provider state, renders stack, supports dismiss button, motion, pointer-safe spacing.

# Why custom instead of adding `svelte-sonner`
- Repo already documents exact context-scoped toast pattern for Svelte 5.
- Current app does not depend on `svelte-sonner`.
- First slice needs simple CMS-only feedback, not full notification library surface.
- Custom impl keeps styling and behavior aligned with current CMS shell without adding dependency/setup churn.

# Integration model
- Initialize toast state in CMS shell or root layout branch that wraps non-auth routes.
- Child routes call toast helpers from enhanced form handlers and client-side guards.
- After action result:
  - success/failure still runs existing store sync + `applyAction/update`
  - route emits toast instead of mutating local banner state
- Remove migrated local feedback markup/state where toast fully replaces it.

# Behavioral rules
- Success toasts auto-dismiss quickly.
- Error toasts stay longer and can be manually dismissed.
- New toast should not clear unrelated existing toasts unless max-stack cap reached.
- Cap visible stack to avoid spam during repeated actions.
- Use toasts only for transient outcomes. Keep inline validation summary when user must act inside same form.

# Accessibility
- Render stack inside polite/assertive live-region split or equivalent tone-aware announcement strategy.
- Ensure dismiss buttons have accessible labels.
- Preserve keyboard reachability without trapping focus.
- Do not rely on color alone for success/error differentiation.

# Styling direction
- Match CMS visual language: calm light surfaces, soft borders, compact typography, no loud gradient treatment.
- Position should avoid covering primary editor controls on common desktop widths.
- Mobile layout should keep stack inset from viewport edges and respect safe areas.

# Testing
- Add unit coverage for toast state helper:
  - add
  - auto-remove
  - manual remove
  - max-stack behavior if implemented
- Add at least one component/route test proving migrated flow emits toast and removes inline banner dependency.

# Review points
- Replace repeated CMS inline action banners with shared transient toasts.
- Scope first slice to CMS editing/library/trash flows, not whole product.
- Build custom toast manager in `src/lib/Toasts/` using repo Svelte 5 context-state pattern.

# Open questions
- None. Proposed defaults below cover first slice.

# Proposed defaults
- Build custom toast manager, not third-party dependency.
- Scope provider to non-auth CMS layout.
- Migrate `/edit/page/[id]`, `/content/[id]`, `/content`, and `/trash` in first pass.
- Leave auth feedback unchanged unless migration falls out naturally with no extra complexity.
- Keep blocking validation copy inline; toast only action outcomes and client-side action guards.

# Risks
- Overusing toasts for validation could hide actionable issues; migration must keep inline errors where user needs exact context.
- Stack position could conflict with existing sticky editor rail on smaller screens if spacing is careless.
- Mixed old inline banners and new toasts during partial rollout could feel inconsistent; first pass should migrate listed routes together.

# Follow-ups
- Consider extending toast system to auth and future media/account screens after CMS slice settles.
- Consider optional action buttons like `Undo` only after delete/restore semantics stabilize.
- If toast usage expands beyond CMS, revisit whether provider should move higher in app tree.

# Recommendation
- Review and approve this design before implementation.
- After approval, implement provider + renderer first, then migrate listed CMS routes in one pass.
