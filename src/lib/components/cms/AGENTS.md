## Scope
- Rules for shared CMS shell, sidebar, editors, modals, and insertion helpers under `src/lib/components/cms/`.

## Read First
- UI implementation: `docs/agents/conventions/ui-shadcn-svelte.md` or skill `ui-shadcn-svelte`
- Editor behavior: `docs/agents/workflows/page-editor.md` or `docs/agents/workflows/content-library.md`
- Sidebar/dashboard behavior: `docs/agents/workflows/dashboard-and-sidebar.md`

## Rules
- Shared CMS behavior belongs here, not route-local copies.
- Prefer repo UI primitives in `src/lib/components/ui/` before bespoke controls.
- Keep icon imports routed through `src/lib/icons/index.ts`.
- Use shared toast system for transient CMS feedback.
- Keep component API aligned with workflow docs; product invariants stay in docs/tests/server helpers, not only visual state.

## Verification
- Check shared flows touched by change in both route surface and reusable component.
