Purpose: describe the initial typed page content model stored in `page_versions.content`.

# Overview
Page content is versioned separately from page metadata and is stored in `page_versions.content`. The current model uses a top-level `version`, a reserved `layout` field, and an ordered `blocks` array.

# How to use
- Treat `page_versions.content` as the source of truth for page structure.
- Use the block registry in `src/lib/blocks/registry.ts` to discover allowed block types and field definitions.
- Parse untrusted content through the page content helper before using it in the app.

# Content shape
```ts
type ReusableBlockReference = {
  id: string;
  type: 'reusable';
  reusableBlockId: string;
};

type PageBlockNode = BlockInstance | ReusableBlockReference;

type PageContent = {
  version: 1;
  layout: null;
  blocks: PageBlockNode[];
};
```

# Initial block types
- `text`: required `body` string.
- `hero`: `heading` string plus optional `publishedOn` date and `priority` number.
- `section`: optional `title` string plus `items` nested blocks field.

# Notes & constraints
- `layout` is reserved for a future layout feature and must be `null` for now.
- Block definitions live in application code, not in the database.
- Data model can represent either inline blocks or content references at top level, but current editor workflow is content-reference-first and no longer creates new top-level inline blocks.
- Content references use `type: 'reusable'` plus `reusableBlockId`.
- Unknown block types or unknown fields are rejected by the content parser.
- Date fields are stored as ISO-like strings in JSON and validated in the application layer.
- Nested blocks are allowed through `blocks` fields and validated recursively.
- Content references are currently allowed only at the top level, not inside nested `blocks` fields.
