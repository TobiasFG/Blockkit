# Scope
- Repo map for Codex.
- Use to place changes fast with minimal reading.

## Read First
- Start here when task scope unclear.
- Then jump to matching workflow doc from `docs/agents/INDEX.md`.

## Directory Map
- `src/routes/`
  - SvelteKit routes, loads, actions, route-local UI.
  - Main CMS surfaces: `/`, `/auth`, `/edit/page/[id]`, `/content`, `/content/[id]`, `/trash`.
- `src/lib/components/cms/`
  - Shared CMS shell, sidebar, editor UI, modal, content insertion helpers.
- `src/lib/components/ui/`
  - Repo-local shadcn-svelte primitives.
- `src/lib/Toasts/`
  - Shared CMS toast state + provider + viewport.
- `src/lib/server/`
  - Server controllers, auth helpers, Prisma DB access.
- `src/lib/supabase/`
  - Shared Supabase client helpers used outside server-only controller layer.
- `src/lib/page*.ts`
  - Page path, SEO, content, status helpers.
- `src/lib/reusableBlock*.ts`
  - Content-library parsing, status, editor helpers.
- `src/lib/blocks/registry.ts`
  - Canonical block definitions and allowed nested field types.
- `src/lib/client/`
  - Client-side stores for sidebar/dashboard refresh.
- `supabase/migrations/`
  - Schema changes. Source of truth for DB shape.
- `e2e/`
  - Playwright coverage.
- `LLMS/Changes.md`
  - Active queue / implementation log.
- `LLMS/Suggestions.md`
  - Optional ideas, not active work until promoted.
- `LLMS/Design/`
  - Historical design docs and unresolved decision context.

## Route Ownership
- `/`
  - Dashboard. Page-first management surface.
- `/auth`
  - Login/signup/logout handoff.
- `/edit/page/[id]`
  - Stable page editor route. Never route editor by mutable slug/path.
- `/content`
  - Content library and folder management.
- `/content/[id]`
  - Dedicated content editor.
- `/trash`
  - Restore surface for deleted pages/content.

## Rules
- Prefer feature-local changes inside existing domain folders.
- Shared UI belongs in `src/lib/components/cms/` or `src/lib/components/ui/`, not duplicated in routes.
- Shared domain logic belongs in `src/lib/*.ts` or `src/lib/server/*.ts`, not embedded across multiple routes.
- DB invariants live in migrations plus server/domain helpers, not only UI.
