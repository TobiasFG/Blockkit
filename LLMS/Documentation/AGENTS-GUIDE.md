Purpose: keep documentation clear, searchable, and useful for both humans and coding agents.

Agent note: if you have not read `AGENTS.md` at the repo root yet, do that first.

# When to write or update docs
- New feature or meaningful behavior change.
- New library, dependency, or component usage.
- Non-obvious workflows, setup, or constraints.

# Where to write docs
- Place feature docs in `LLMS/Documentation/` under a descriptive folder.
- Keep library/component docs in their respective collections (e.g., `shadcn-svelte/`).
- Update `LLMS/Documentation/AGENTS-INDEX.md` whenever docs change.

# How to structure docs
- Start with a short purpose sentence.
- Add a minimal “How to use” section.
- Include key constraints, pitfalls, and defaults.
- Use headings and short paragraphs; avoid long walls of text.

# Agent expectations
- Agents should check the index and existing docs before implementing or changing features.
- Keep docs accurate and up to date with code changes.
- Treat documentation updates as part of completing the corresponding implementation, not as optional follow-up work.
- When a change adds or materially changes behavior, ensure the relevant docs are created or updated in the same task.
- When documenting a larger feature design elsewhere in the repo, include review points, open questions, risks, follow-ups, and proposed defaults when they are relevant to implementation decisions.
- Prefer concise, precise language over long explanations.
- Perfer to use Mermaid diagrams for models and complex flows or logic if it is meaningful to do so.
