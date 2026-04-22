---
name: sveltekit-feature
description: Build or refactor SvelteKit features in this repo. Use for route work, server loads/actions, shared lib helpers, CMS/editor flows, and wiring UI to server/domain logic without bloating root instructions.
---

# Use When
- Task spans route files plus shared lib/server code.
- Trigger phrases: `add feature`, `wire action`, `refactor route flow`, `update editor flow`, `change route behavior`.

## Do Not Use When
- Task is schema-only. Use `supabase-schema-change`.
- Task is purely stylistic UI primitive work. Use `ui-shadcn-svelte` if that is core job.

## Inputs To Inspect First
- `docs/agents/architecture/repo-map.md`
- Nearest local `AGENTS.md`
- Relevant workflow doc in `docs/agents/workflows/`
- `docs/agents/conventions/svelte-state.md` for shared state work

## Steps
1. Identify owning route plus shared domain/server files for feature slice.
2. Keep route loads/actions thin. Move reusable or stateful logic into `src/lib/` or `src/lib/server/`.
3. Preserve stable route contracts:
   - page editor by stable id
   - content editor by stable id
   - auth redirect behavior
   - trash routes and restore semantics
4. Keep client/shared state aligned with repo Svelte conventions.
5. Update docs only where behavior or routing contract changed.
6. Hand off to `test-and-verify` workflow before final response.

## Verification
- `bun run check`
- Relevant unit tests for moved/shared logic
- Relevant route or e2e coverage when user-visible flow changes

## Output Expectations
- Feature code lands in owning route plus shared layers with minimal duplication.
- Final response states changed contract and verification.
