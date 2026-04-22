# Scope
- CMS UI implementation defaults.

## Use When
- Touching CMS UI, adding controls, dialogs, tabs, buttons, theme behavior, toasts, or icon buttons.

## Rules
- Shadcn-svelte first for controls that already exist in repo-local `src/lib/components/ui/`.
- If shadcn doc recommends component not installed yet, install it instead of hand-rolling substitute.
- Use repo theme tokens:
  - `background`
  - `foreground`
  - `card`
  - `muted`
  - `border`
  - `primary`
  - `destructive`
- Avoid hard-coded light-only slate/stone stacks when touching CMS UI.
- Icon imports route through `src/lib/icons/index.ts`.
- Use shared CMS toasts instead of route-local success/error banners for transient action feedback.
- Toast API/details live in `docs/agents/workflows/toasts.md`.

## Layout Direction
- Follow existing CMS art direction before generic UI priors.
- Prefer calmer editorial hierarchy over stacked admin cards.
- Main work in content column, state/actions in side rail for editors.
- Keep visible focus states and touch-safe targets.

## Theme / Motion
- Global theme uses `mode-watcher` via root layout and `ThemeToggle`.
- Auth transition should stay transform/opacity based.
- Respect reduced motion.

## Exceptions
- Native `<select>` still acceptable in flows where Bits/shadcn hidden-input behavior is not worth churn.
- Hand-built controls are exception path. If primitive exists, use it unless repo-specific behavior blocks it.
