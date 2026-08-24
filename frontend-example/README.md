# Blockkit frontend example

A minimal SvelteKit site that consumes published Blockkit content: it reads the CMS
database directly, renders every published page at its own path, and resolves
reusable block references to their published versions.

## Run

```
cd frontend-example
bun install
cp .env.example .env   # DATABASE_URL from `supabase status`
bun run dev
```

Then open http://localhost:5174/ — the root page, with links to every other published page.

## How it works

- `src/lib/server/publishedContent.ts` — queries `pages`/`page_versions` joined on
  `published_version_id`, rebuilds each page's path from its `path_segment` chain, and
  swaps `reusable` nodes for their published `reusable_block_versions.content`.
- `src/routes/[...path]/+page.server.ts` — resolves the request path to a published page,
  404s otherwise.
- `src/lib/blocks/*.svelte` — one component per block type in the CMS registry
  (`text`, `hero`, `section`). `Section` recurses through `Block` for nested blocks.

Only published versions are ever read, so CMS drafts and trashed pages stay invisible here.
Add a block type to the CMS registry, then add a matching component and a branch in
`Block.svelte`.
