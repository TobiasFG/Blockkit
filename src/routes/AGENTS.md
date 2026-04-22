## Scope
- Rules for SvelteKit routes, loads, and actions under `src/routes/`.

## Read First
- Auth or session gate: `docs/agents/workflows/auth.md`
- Dashboard/sidebar: `docs/agents/workflows/dashboard-and-sidebar.md`
- Page editor: `docs/agents/workflows/page-editor.md`
- Content library/editor: `docs/agents/workflows/content-library.md`
- Trash/delete/restore: `docs/agents/workflows/trash.md`
- Shared feedback: `docs/agents/workflows/toasts.md`

## Rules
- Keep route loads/actions thin. Push reusable domain logic into `src/lib/server/` or shared helpers.
- CMS editor routes use stable ids, not mutable paths.
- Preserve auth gate on CMS routes/actions.
- Use shared CMS toasts for transient action feedback.

## Verification
- `bun run check`
- Run route-level tests when load/action behavior changes.
