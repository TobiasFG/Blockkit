## Scope
- Rules for server-only auth, data-access, controllers, and Prisma integration under `src/lib/server/`.

## Read First
- Auth/session work: `docs/agents/workflows/auth.md`
- Page/content invariants: `docs/agents/architecture/cms-data-model.md`
- Schema change: `supabase/AGENTS.md` and skill `supabase-schema-change`

## Rules
- Keep Prisma DB access in server-only modules.
- Preserve route auth gate even when controller uses service role.
- Encode page/content/trash invariants in server helpers or migrations, not UI only.
- Keep route files thin. Shared server logic belongs here, not duplicated across actions/load functions.

## Verification
- `bun run check`
- Run relevant unit tests for touched helpers/controllers.
