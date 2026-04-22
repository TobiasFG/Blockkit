# Blockkit

SvelteKit + TypeScript + Tailwind + Supabase CMS experiment.

## Setup
1. `bun install`
2. `supabase start`
3. Put Supabase values in `.env` from `.env.example`
4. `supabase db reset`
5. `bun run dev -- --open`

## Verify
- Type check: `bun run check`
- Unit tests: `bun run test:unit -- --run`
- E2E: `bun run test:e2e`

## Agent Docs
- Start: `AGENTS.md`
- Index: `docs/agents/INDEX.md`

## Note
- `SUPABASE_SERVICE_ROLE_KEY` stays server-only. Never expose in browser code.
