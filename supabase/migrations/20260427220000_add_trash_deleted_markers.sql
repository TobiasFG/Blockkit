alter table public.pages
  add column if not exists deleted_at timestamptz;

alter table public.reusable_blocks
  add column if not exists deleted_at timestamptz;
