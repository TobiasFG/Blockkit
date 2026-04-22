---
name: ui-shadcn-svelte
description: Implement CMS UI with repo-local shadcn-svelte primitives and existing Blockkit art direction. Use for controls, dialogs, tabs, toasts, icon buttons, theme-aware styling, and avoiding bespoke admin UI drift.
---

# Use When
- Adding or replacing CMS controls, dialogs, tabs, buttons, badges, icon buttons, or toast visuals.
- Trigger phrases: `use shadcn`, `replace bespoke control`, `add dialog`, `match CMS UI`, `fix theme tokens`.

## Do Not Use When
- Task is mainly product behavior or editor workflow semantics. Read workflow docs instead.
- Task is non-CMS marketing/frontpage design with separate art direction.

## Inputs To Inspect First
- `docs/agents/conventions/ui-shadcn-svelte.md`
- `src/lib/components/ui/**`
- `src/lib/components/cms/AGENTS.md`
- Relevant workflow doc for touched surface

## Steps
1. Check whether repo already has suitable primitive under `src/lib/components/ui/`.
2. If primitive exists, use it. If shadcn component is missing but appropriate, add/install repo-native version instead of hand-rolling substitute.
3. Keep styling on repo theme tokens and existing CMS art direction.
4. Route icon imports through `src/lib/icons/index.ts`.
5. Keep transient feedback in shared toast system, not route-local banners.
6. Avoid introducing duplicate bespoke control when shared primitive fits.

## Verification
- Focus states visible.
- Dark/light mode and reduced-motion behavior still intact where relevant.
- No new ad-hoc primitive duplicates existing shared UI.

## Output Expectations
- Shared UI stays more consistent after change, not less.
