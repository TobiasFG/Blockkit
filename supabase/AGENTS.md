## Scope
- Rules for schema and seed work in `supabase/`.

## Read First
- `docs/agents/architecture/cms-data-model.md`
- Skill `supabase-schema-change`

## Rules
- Migrations are source of truth for DB shape.
- Keep schema aligned with current product direction; no compatibility shims unless user asks.
- Preserve page/content versioning, publish, and trash invariants.
- When schema changes behavior, update matching workflow docs in `docs/agents/`.

## Verification
- Inspect migration for forward-only correctness.
- Run repo checks/tests needed for affected app paths.
