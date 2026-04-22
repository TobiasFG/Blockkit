---
name: supabase-schema-change
description: Change Supabase schema for Blockkit. Use for migrations, versioned page/content models, trash behavior, publish flows, seed updates, and keeping schema/docs/server logic aligned.
---

# Use When
- User asks for migration, schema change, seed update, DB invariant change, or publish/trash model change.
- Trigger phrases: `add migration`, `change schema`, `update Supabase tables`, `fix DB invariant`, `change publish flow`.

## Do Not Use When
- Change is route/UI only with no schema impact.
- Need architecture explanation only. Read docs instead.

## Inputs To Inspect First
- `supabase/AGENTS.md`
- `docs/agents/architecture/cms-data-model.md`
- Latest related file in `supabase/migrations/`
- Affected server helpers in `src/lib/server/`
- Relevant design in `LLMS/Design/` if task continues prior design work

## Steps
1. Find current invariant. Read data-model doc plus latest related migration.
2. Define target DB contract in terms of stable ids, version rows, publish resolution, trash rules, and auth boundaries.
3. Write forward-only migration for current product direction. No compatibility shim unless user asked.
4. Update affected server helpers/controllers so app logic matches new schema.
5. Update only docs whose invariants changed. Prefer contract-level edits over table-by-table narration.
6. If local DB reset/apply not run, note exact gap in final response.

## Verification
- Inspect migration for forward-only correctness and invariant coverage.
- `bun run check`
- Run relevant unit tests for touched server/domain code.
- Verify affected docs/path references still point to current source of truth.

## Output Expectations
- Migration plus required app/doc updates land together.
- Final response states DB changes, verification run, and any unapplied local migration steps.
