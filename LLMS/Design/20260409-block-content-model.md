Purpose: define the initial block content model for versioned page content before any editor or rendering work begins.

# Goal
- Define a typed block schema that fits inside `page_versions.content`.
- Support a small set of field types for block data: string, date, number, boolean, and nested blocks.
- Keep pages ready for a future layout concept without forcing layout work into this change.

# Scope
- Document the JSON shape for page content and blocks.
- Define the initial block definition model used to describe what data a block can hold.
- Define validation and storage rules for nested blocks.
- Identify the minimum implementation slices needed after design approval.

# Non-goals
- Do not build the page editor UI in this change.
- Do not implement frontend rendering of blocks in this change.
- Do not design a full visual layout system yet.
- Do not add advanced field types such as rich text, references, media pickers, enums, or custom validators.

# Existing constraints
- `public.page_versions.content` already exists and defaults to `{"version":1,"blocks":[]}`.
- Current database checks only guarantee that `content.blocks` exists and is an array.
- Page metadata such as SEO is already stored separately in `page_versions.meta`.

# Proposed model
Keep `page_versions.content` as the source of truth for page structure.

```ts
type PageContent = {
  version: 1;
  layout: null;
  blocks: BlockInstance[];
};
```

`layout` stays present but `null` for now so the shape is ready for a future layout feature without another breaking content rewrite.

## Block definitions
Blocks need a schema-like definition so the system knows which fields a block instance can store.

```ts
type BlockFieldType = 'string' | 'date' | 'number' | 'boolean' | 'blocks';

type BlockFieldDefinition = {
  key: string;
  label: string;
  type: BlockFieldType;
  required?: boolean;
  blocks?: {
    allowedTypes?: string[];
  };
};

type BlockDefinition = {
  type: string;
  label: string;
  fields: BlockFieldDefinition[];
};
```

# Block instance shape
Each page stores block instances, not definitions.

```ts
type BlockValue = string | number | boolean | null | BlockInstance[];

type BlockInstance = {
  id: string;
  type: string;
  fields: Record<string, BlockValue>;
};
```

## Date handling
- Store `date` field values as ISO 8601 strings.
- Use full timestamps when time matters; plain dates such as `2026-04-09` are also valid.
- Treat date values as strings in JSON, with validation handled by the application layer.

## Nested blocks
- A field with type `blocks` stores an array of `BlockInstance`.
- Nested blocks allow container-style structures such as sections, columns, accordions, or a page body area.
- The initial model should allow unrestricted nesting depth in data, but the first editor implementation should cap UI nesting depth if needed for simplicity.
- `allowedTypes` is optional. If omitted, any registered block type may be nested in that field.

# Example
This shows a page-level block tree with a container block that owns child blocks.

```json
{
  "version": 1,
  "layout": null,
  "blocks": [
    {
      "id": "hero-1",
      "type": "hero",
      "fields": {
        "heading": "Blockkit",
        "publishedOn": "2026-04-09",
        "featured": true,
        "priority": 1
      }
    },
    {
      "id": "section-1",
      "type": "section",
      "fields": {
        "title": "Highlights",
        "items": [
          {
            "id": "text-1",
            "type": "text",
            "fields": {
              "body": "Fast content modeling."
            }
          }
        ]
      }
    }
  ]
}
```

# Validation rules
- `content.version` must be `1`.
- `content.layout` must be `null` for now.
- `content.blocks` must be an array of block instances.
- Every block instance must have a stable `id`, a `type`, and a `fields` object.
- Field values must match the definition for the block type.
- Unknown block fields should be rejected on write so content stays aligned with registered definitions.
- Missing optional fields may be omitted entirely from `fields`.
- Required fields should be enforced by the application layer before saving drafts.

# Definition storage
Start with block definitions in application code rather than in the database.

Why:
- It keeps the first iteration smaller.
- It avoids introducing CMS schema-management UI before the content model is proven.
- It gives the editor and renderer a typed registry they can share.

Recommendation:
- Add a server/client-safe block registry module such as `src/lib/blocks/registry.ts`.
- Export typed definitions keyed by block `type`.
- Use the registry for validation, default value creation, and future editor rendering.

# Initial block types
Do not try to solve every content use case immediately. Start with a few examples that exercise the primitive field types and nested blocks.

Recommended initial set:
- `text`: one `string` field for basic copy.
- `hero`: string, date, number, and boolean fields to exercise primitives.
- `section`: string field plus one `blocks` field for nested children.

This keeps the first implementation small while proving the model can express both leaf and container blocks.

# Implementation plan after approval
1. Add shared TypeScript types for `PageContent`, `BlockDefinition`, `BlockInstance`, and field values.
2. Add a block registry with 2-3 seed block definitions.
3. Add parse/validation helpers for `page_versions.content`.
4. Update page-version read/write helpers to use typed content objects instead of raw JSON.
5. Add tests covering primitive fields, nested blocks, and invalid content.
6. Build the first draft-only editor UI in a later change.

# Risks
- If definitions live only in code at first, non-developer schema editing is not possible yet.
- Unlimited nested blocks can create hard-to-use editor interactions if UI constraints are not added later.
- Choosing overly generic initial block types could make the first editor feel abstract rather than useful.

# Open questions
- Should block ids be UUIDs, cuid-style strings, or any unique string generated client-side?
- Should `blocks` fields preserve order only, or also support keyed slots later?
- When layout work starts, should layout be a named template in `content.layout` or another top-level block container?

# Recommendation
- Approve this content model first.
- Implement typed content parsing/validation and a small block registry in the next change.
- Defer the visual editor and layout system until the underlying model is stable.
