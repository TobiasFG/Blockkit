# Scope
- Canonical verification commands and task-specific checks.

## Commands
- Install deps: `bun install`
- Dev server: `bun run dev -- --open`
- Type / Svelte checks: `bun run check`
- Unit tests: `bun run test:unit -- --run`
- E2E tests: `bun run test:e2e`
- Full test pass:
  - prefer `bun run test:unit -- --run`
  - then `bun run test:e2e`
  - do not use `npm run test`
- Local Supabase reset: `supabase db reset`

## Use When
- Before final response after code/doc changes.
- When adding coverage for page/content/auth/trash/schema work.

## Minimum Verification
- Docs-only change: search for stale paths, duplicates, contradictions.
- UI/domain code change: run `bun run check` plus relevant unit tests.
- Route flow or integration change: run relevant e2e or targeted route tests when available.
- Schema change: inspect migration and verify matching server/domain/docs updates.

## CMS-Specific Checks
- Page editor: save, publish, revert, idle-action hiding.
- Content editor: same action-state parity as page editor.
- Trash: deleted items leave normal lists; restore constraints still enforced.
- Auth: signed-out redirect still works; service-role key stays server-only.
