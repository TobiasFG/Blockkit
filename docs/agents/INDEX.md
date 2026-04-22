# Agent Docs Index

Use after root `AGENTS.md`. Do not read everything. Pick smallest matching item.

## Local Instructions
- `src/routes/AGENTS.md`
  - Read when: editing route files, loads, actions, or redirects.
  - Answers: route-level boundaries, auth/toast expectations, when to move logic out of routes.
  - Governs: `src/routes/**`
  - Type: local instruction
- `src/lib/server/AGENTS.md`
  - Read when: editing controllers, auth helpers, Supabase access, or server-only invariants.
  - Answers: where service-role logic lives, what must stay server-only, how route/server split should look.
  - Governs: `src/lib/server/**`
  - Type: local instruction
- `src/lib/components/cms/AGENTS.md`
  - Read when: editing shared CMS shell, sidebar, editor, modal, or insertion components.
  - Answers: shared component boundaries, UI primitive expectations, workflow-doc links.
  - Governs: `src/lib/components/cms/**`
  - Type: local instruction
- `supabase/AGENTS.md`
  - Read when: adding migrations, changing schema, or touching seed/data bootstrap.
  - Answers: migration source-of-truth rules and schema-specific safety constraints.
  - Governs: `supabase/**`
  - Type: local instruction

## Skills
- `supabase-schema-change`
  - Read/use when: user asks for schema, migration, publish/trash model, or DB invariant changes.
  - Answers: step order for safe schema work and what must ship with it.
  - Governs: `supabase/migrations/**`, affected server/domain code, related docs.
  - Type: skill
- `sveltekit-feature`
  - Read/use when: task spans route, shared lib, and server code in one feature slice.
  - Answers: how to deliver repo-native SvelteKit changes without bloating route files.
  - Governs: `src/routes/**`, `src/lib/**`, `src/lib/server/**`
  - Type: skill
- `test-and-verify`
  - Read/use when: choosing proof for change or closing task.
  - Answers: smallest credible verification set by task type.
  - Governs: repo-wide verification
  - Type: skill
- `ui-shadcn-svelte`
  - Read/use when: changing shared CMS UI primitives, dialogs, tabs, buttons, toast visuals, or token-driven styling.
  - Answers: operational sequence for shadcn-first UI work in this repo.
  - Governs: `src/lib/components/ui/**`, `src/lib/components/cms/**`, `src/lib/Toasts/**`, route Svelte UI
  - Type: skill

## Architecture
- `architecture/repo-map.md`
  - Read when: scope unclear, choosing file ownership, or placing new code.
  - Answers: where routes, shared UI, server logic, block registry, tests, and DB assets live.
  - Governs: `src/**`, `supabase/**`, `e2e/**`
  - Stability: stable reference
- `architecture/cms-data-model.md`
  - Read when: changing pages, content, versioning, publish state, trash, URLs, or schema.
  - Answers: stable ids, version relationships, publish resolution, content-reference constraints, trash invariants.
  - Governs: page/content domain code, server controllers, editor routes, migrations
  - Stability: stable reference

## Conventions
- `conventions/svelte-state.md`
  - Read when: adding `.svelte.ts` state, context state, timers, or client-side shared state.
  - Answers: approved rune patterns, SSR-safe state shapes, anti-patterns.
  - Governs: `src/lib/**/*.svelte.ts`, client state modules
  - Stability: stable reference
- `conventions/ui-shadcn-svelte.md`
  - Read when: you need design-system rules but not full UI workflow.
  - Answers: primitive-first UI policy, theme token usage, icon/toast defaults.
  - Governs: shared CMS UI and toast surfaces
  - Stability: medium; conventions stable, exact component mix may evolve

## Workflows
- `workflows/change-management.md`
  - Read when: task starts from queue/backlog or needs new doc/design/history entry.
  - Answers: promotion flow, when design doc required, what to update alongside implementation.
  - Governs: `LLMS/Changes.md`, `LLMS/Suggestions.md`, `LLMS/Design/**`
  - Stability: stable workflow
- `workflows/auth.md`
  - Read when: touching login/signup/logout, auth redirects, session validation, or SSR auth plumbing.
  - Answers: current auth contract, required env, route-gate responsibilities.
  - Governs: `src/hooks.server.ts`, `src/routes/auth/**`, `src/routes/+layout.server.ts`, `src/lib/server/auth.ts`
  - Stability: medium; contracts stable, implementation points may shift
- `workflows/dashboard-and-sidebar.md`
  - Read when: touching dashboard, sidebar trees, navigation actions, or status badges.
  - Answers: ownership split between dashboard/sidebar/content tree and current user-facing invariants.
  - Governs: dashboard route plus shared sidebar/tree helpers
  - Stability: medium-high; keep to invariants, not exact UI layout
- `workflows/page-editor.md`
  - Read when: touching `/edit/page/[id]`, page identity, page content editing, or page publish flow.
  - Answers: stable editor route, action-state contract, identity/path rules, page-content boundaries.
  - Governs: page editor route, page helpers, block list editor, path/SEO helpers
  - Stability: medium-high; behavior evolves, invariants must hold
- `workflows/content-library.md`
  - Read when: touching `/content`, `/content/[id]`, folders, page insertion from content, or content publish flow.
  - Answers: content-library responsibilities, editor parity points, folder/delete/reference invariants.
  - Governs: content routes, reusable-content helpers, insertion helpers, content tree components
  - Stability: medium-high; behavior evolves, invariants must hold
- `workflows/trash.md`
  - Read when: touching delete/restore behavior or redirects for trashed resources.
  - Answers: trash semantics, restore constraints, route visibility expectations.
  - Governs: trash route plus delete/restore flows across pages/content
  - Stability: stable workflow
- `workflows/testing-and-verification.md`
  - Read when: you need reference commands or CMS-specific verification targets.
  - Answers: canonical commands and what to prove for route/UI/schema changes.
  - Governs: repo-wide verification
  - Stability: medium; commands stable, surface-specific checks may evolve
- `workflows/toasts.md`
  - Read when: touching shared transient feedback system.
  - Answers: toast API contract, when toast vs inline feedback, provider/state expectations.
  - Governs: `src/lib/Toasts/**`, toast call sites
  - Stability: medium-high; API stable, visuals may evolve

## Decisions And History
- `decisions/doc-system.md`
  - Read when: reorganizing agent docs or deciding doc vs local rule vs skill.
  - Answers: why this layered system exists and what belongs where.
  - Governs: agent-guidance structure
  - Stability: stable decision
- `LLMS/Changes.md`
  - Read when: continuing queued work or logging new user-reported work.
  - Answers: active and completed change items.
  - Governs: implementation queue and change log
  - Stability: evolving record
- `LLMS/Suggestions.md`
  - Read when: user asks for optional ideas or backlog review.
  - Answers: uncommitted suggestions that still need promotion.
  - Governs: optional backlog only
  - Stability: evolving record
- `LLMS/Design/*.md`
  - Read when: continuing feature with prior design, rationale, or unresolved review points.
  - Answers: why prior design exists and what decisions may still need user input.
  - Governs: design history only
  - Stability: historical reference
