alter table public.reusable_block_versions
  add column if not exists name text,
  add column if not exists folder_id uuid references public.block_folders(id) on delete set null,
  add column if not exists block_type text;

update public.reusable_block_versions rbv
set name = coalesce(rbv.name, rb.name),
    folder_id = coalesce(rbv.folder_id, rb.folder_id),
    block_type = coalesce(rbv.block_type, rb.block_type)
from public.reusable_blocks rb
where rb.id = rbv.reusable_block_id;

alter table public.reusable_block_versions
  alter column name set not null,
  alter column block_type set not null;

alter table public.reusable_blocks
  drop column if exists name,
  drop column if exists folder_id,
  drop column if exists block_type,
  drop column if exists content;
