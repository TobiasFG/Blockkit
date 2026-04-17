alter table public.pages
  add column if not exists deleted_at timestamptz null;

create index if not exists pages_deleted_at_idx on public.pages(deleted_at);

alter table public.reusable_blocks
  add column if not exists deleted_at timestamptz null;

create index if not exists reusable_blocks_deleted_at_idx on public.reusable_blocks(deleted_at);
