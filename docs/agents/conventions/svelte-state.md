# Scope
- Svelte 5 shared-state rules for this repo.

## Use When
- Adding `.svelte.ts` state modules, context state, shared client state, timers, subscriptions, or exported mutable state.

## Defaults
- Prefer `$state` / `$derived` over legacy stores for new rune-native state.
- Prefer factories, accessor objects, proxied objects, or classes for exported mutable state.
- Keep request-specific data out of module singletons.

## Approved Patterns
- Proxied object
  - use for small shared mutable objects where direct property mutation is fine
- Context-scoped class
  - use for feature-global state tied to component/request lifetime
  - good fit for toasts, modal managers, editor session state
- Accessor object
  - use for primitive state with guarded writes or derived values
- Factory
  - use for per-instance scoped state
- Class
  - use for richer domain state with invariants/method grouping

## Do Not
- Export bare mutable primitive rune state for cross-module writes.
- Destructure accessor-backed reactive values.
- Introduce stores by habit when runes solve problem directly.
- Put long-lived side effects in module singleton setup without explicit lifetime.

## SSR Rules
- Context-scoped state preferred over process-wide singleton when state has timers, subscriptions, DOM handles, or request-bound data.
- Effects need explicit lifetime/cleanup.
