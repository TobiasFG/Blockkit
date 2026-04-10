# Blockkit

SvelteKit + Tailwind + Supabase (local-first) CMS experiment.

## Setup (local)

1. Install deps:
   - `bun install` (or `npm install`)
2. Start Supabase:
   - `supabase start`
3. Put your Supabase API URL + `service_role` key into `.env` (see `.env.example`):
   - `supabase status`
4. Apply migrations (creates `public.pages` and seeds `Home`):
   - `supabase db reset`
5. Run the app:
   - `bun run dev -- --open` (or `npm run dev -- --open`)

## Notes

- Server-side page CRUD uses the Supabase `service_role` key (`src/lib/server/supabase.server.ts`). Never expose it to the browser or commit it to git.

