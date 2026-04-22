Purpose: define CMS-wide UI framework defaults so editors use shadcn-svelte primitives before hand-crafting controls.

# How to use
- Prefer existing shadcn-svelte components from `src/lib/components/ui/` for buttons, inputs, textareas, badges, alerts, tabs, dropdowns, dialogs, sheets, and related shell controls.
- Use repo theme tokens (`background`, `foreground`, `card`, `muted`, `border`, `primary`, `destructive`) instead of hard-coded light-only slate/stone color stacks when touching CMS UI.
- Add new shadcn components with `node_modules/.bin/shadcn-svelte add <component>` so generated files stay in repo-local registry style.
- Global dark/light/system mode is driven by `mode-watcher` through `src/routes/+layout.svelte` and `src/lib/components/ThemeToggle.svelte`.

# Current baseline
- Dashboard, auth, content library, trash, page editor, reusable-content editor, block-list editor, shared icon buttons, and shared confirmation modal now route primary controls through shadcn-svelte primitives where practical.
- CMS shell header and auth route expose theme toggle; desktop/mobile flows both inherit same `ModeWatcher` class switching.
- Confirmation modals use shadcn `alert-dialog` wrapper instead of custom overlay/dialog markup.
- Shared compact icon actions use shadcn `Button`.
- Editor tab rails use shadcn `Tabs`.

# Constraints
- Native `<select>` still appears in some flows where Bits/shadcn hidden-input behavior was not worth extra migration churn for this pass.
- Context-menu behavior still relies on Bits primitives already used by shadcn-svelte internals; keep visual wrappers aligned with shadcn token classes when editing those menus.
- New CMS screens should treat hand-built controls as exception path. If shadcn primitive exists, use it unless repo-specific behavior blocks it.
