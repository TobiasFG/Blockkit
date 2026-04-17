Read `AGENTS.md` at the repo root.

File purpose: capture optional ideas and improvements that are not yet committed to the roadmap as well as bug reports.

Guidelines:
- Keep entries lightweight and easy to read fast.
- Explain the benefit and potential tradeoffs.
- Note any prerequisites or dependencies.
- Label with a rough value estimate if possible (e.g., `nice-to-have`, `useful`, `high-value`).
- Promote items to `LLMS/Changes.md` once they move into active design or development.
- If an agent is asked to work from `LLMS/Suggestions.md`, the agent must first promote the chosen suggestion into `LLMS/Changes.md` before implementation work starts.
- After promotion, decide whether the selected item is a larger feature. If yes, write a design in `LLMS/Design` and stop for review before implementation. If no, record it in `LLMS/Changes.md` as a small change and then implement it.
- Do not copy design review points, open questions, risks, or follow-ups here unless they are actual future suggestions that belong in this file.

# Suggestions
- we currently have a "reset draft" button when editing pages or content, i do not like that, if something have changed, there should be a button saying revert changes to draft/published depending on whether the orignally displayed content was draft or published
- I would like to get started on the feature where users can also manage media like images and videos in the content area. These should be stored in supabase and it should then be possible to use them in content blocks or on pages' seo. When creating new media content it should be possible to either upload a media file or provide a link. It should be possible to preview media content by clicking on it.

# Bugs
