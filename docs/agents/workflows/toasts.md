# Scope
- Shared CMS toast system.

## Use When
- Touching transient success/error/info/warning feedback.
- Editing toast visuals, actions, timing, or provider/state API.

## Rules
- Mount `src/lib/Toasts/ToastProvider.svelte` once in CMS layout.
- Read state with `getToastState()` in child components/routes.
- Use short helpers for simple outcomes:
  - `success(message)`
  - `error(message)`
- Use richer API for custom title/body/actions/timing:
  - `show({...})`
  - `info({...})`
  - `warning({...})`
- Use inline validation, not toast, when editor must fix fields in place.

## Toast Contract
- Visible heading required. `message` shorthand normalizes into title.
- Optional description supports extra context.
- Tone, duration, dismissibility, and actions belong in shared toast payload, not ad-hoc per route markup.

## UI Rules
- Use shared renderer; avoid route-local success/error banners for transient feedback.
- Keep copy short and action-linked.
- Progress/timing behavior stays in shared toast system, not duplicated at call sites.

## Defaults
- Success/info/warning: short auto-dismiss.
- Error: longer auto-dismiss.

## Verification
- Toast provider stays mounted once in CMS layout.
- Helper calls and richer payload calls still render through shared state.
- Transient feedback remains toast-based while field-fix validation stays inline.
- Timing/progress behavior still comes from shared renderer, not route-local implementations.
