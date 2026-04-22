# Scope
- Queue/design/doc workflow for repo changes.

## Use When
- Task starts from `LLMS/Changes.md`.
- Task starts from `LLMS/Suggestions.md`.
- User reports bug, feature, change, or investigation.
- You need design or historical context.

## Rules
- Add reported bugs/features/changes/investigations to `LLMS/Changes.md`.
- Keep one item per entry with clear title, status, date, priority, impact.
- `LLMS/Suggestions.md` is optional ideas only.
- Do not implement directly from `LLMS/Suggestions.md`.
- First promote chosen suggestion into `LLMS/Changes.md`.
- Larger feature:
  - write design in `LLMS/Design/`
  - stop for user review if unresolved review points/open questions/risks materially affect scope or behavior
- Small/local change:
  - queue entry in `LLMS/Changes.md`
  - implement directly
- Update relevant docs in same task.
- If docs move/add/delete, update `docs/agents/INDEX.md`.

## Historical Docs
- `LLMS/Design/` stays as reference history and pending-design store.
- Design docs answer why and what remains unresolved.
- Do not duplicate full design prose into agent workflow docs.

## Entry Points
- User says "work from `LLMS/Changes.md`":
  - choose relevant open item unless user narrowed scope.
- User says "work from `LLMS/Suggestions.md`":
  - choose suggestion
  - promote to `LLMS/Changes.md`
  - decide if design required
  - stop for review only if large-feature unresolved decisions matter

## Verification
- Queue item status/history should match actual state.
- Changed docs and changed behavior should ship together.
