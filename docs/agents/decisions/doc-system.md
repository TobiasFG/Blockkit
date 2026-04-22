# Scope
- Canonical structure for Codex-facing guidance in this repo.

## Layering
- Root `AGENTS.md`
  - repo-wide policy, routing, safety, commands
  - should stay short and durable
- Local `AGENTS.md`
  - subtree-only rules that change good defaults in that tree
  - add only where repeated local context saves time
- `docs/agents/`
  - reference docs and decision support
  - architecture, conventions, workflows, decisions
- `.agents/skills/`
  - repeatable operational playbooks with triggers, inputs, steps, verification
- `LLMS/Changes.md`
  - active queue and implementation log
- `LLMS/Suggestions.md`
  - optional backlog only
- `LLMS/Design/`
  - design history and unresolved design review context

## Decision Rules
- If content says what always applies repo-wide, keep it in root `AGENTS.md`.
- If content matters only in one subtree, keep it in local `AGENTS.md`.
- If content explains system behavior, contracts, or rationale, keep it in `docs/agents/`.
- If content describes repeatable multi-step job with clear trigger and verification, make it skill.

## Anti-patterns
- Same rule copied into root `AGENTS.md`, local `AGENTS.md`, docs, and skill.
- Feature behavior prose in root `AGENTS.md`.
- Architecture explanation packaged as skill.
- Volatile implementation detail treated as canonical doc.

## Maintenance
- When doc paths change, update `docs/agents/INDEX.md`.
- Prefer invariants, contracts, and verification targets over code narration.
- Delete or merge guidance that no longer changes agent decisions.
