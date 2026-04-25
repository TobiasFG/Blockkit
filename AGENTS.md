## Scope
- Repo-wide policy for Codex.
- Keep always-on guidance small. Load detail from `docs/agents/INDEX.md`, nearest local `AGENTS.md`, and repo skills only when task matches.

## Commands
- Use `bun`.
- Core commands:
  - `bun run dev`
  - `bun run check`
  - `bun run test:unit -- --run`
  - `bun run test:e2e`

## Read First
- Start with `docs/agents/INDEX.md`.
- Before edits in subtree, read nearest local `AGENTS.md`.
- Task from `LLMS/Changes.md` or `LLMS/Suggestions.md`: read `docs/agents/workflows/change-management.md`.
- Need historical rationale or unresolved design context: read matching file in `LLMS/Design/`.

## Repo-wide Rules
- Read only docs needed for task.
- Use repo skills only when task matches their trigger; do not load them by default.
- Update affected agent docs in same task when behavior or paths change.
- If docs move/add/delete, update `docs/agents/INDEX.md`.
- If user reports bug, feature, change, or investigation, add entry to `LLMS/Changes.md`.
- `LLMS/Suggestions.md` never source of truth for direct implementation. Promote chosen item into `LLMS/Changes.md` first.
- If user asked for specific task, keep scope tight.
- Early-development default: no backward-compat shims, migrations, or legacy preservation unless user asks.
- Prefer clean replacement/rewrites over layering fixes onto bad code. If a rewrite results in cleaner code and leaner solution, it is almost always the better approach over bad patch work.

## Verification Expectations
- Run smallest check set that proves change.
- Use repo verification skill/doc when scope unclear.
- Final response must state what was verified and what was not.

## Safety Boundaries
- Supabase service-role key stays server-only.
- Keep CMS auth gate intact on protected routes/actions.
- Confirm destructive or irreversible operations before running them.
