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
- We need a system for restoring deleted content. If content is deleted it should be marked as deleted but still be findable in some sort of trash overview from where it can be restored. I dont remember if content can be deleted when it is used in other content or pages but, that also needs to be managed in a clear a way that empowers the users. Ideally deleting content in use should display a warning to the user that the content is in use, including where, prompting extra acceptance before deletion, while deleting unused content should just delete immediately.
- I would like to combine the ui actions when editing pages/content. If there are no changes the button should be disabled with the lable "all changes saved", if there are changes the button should be enabled and say "save draft", if there is a unpublished draft the button should be enabled and say "publish", we should remove the "Validation    Ready to save" line, if there are errors the button should be disabled and say "validation error"
- I would like to change the way pages page link is handled. Right now the user have to actively write the full path, eg. "/about/us/open-position", which can become cumbersome. It would be better if pages simply had a required title, required parent that defines the location, and then an optional url name. If a page has no url name, the title should be used (of cause url-encoded.), eg. a page "We love us" without url name set would become "we%20love%20us" automatically, but then the user can choose to override the url name to eg. "we-love-us"

# Bugs
