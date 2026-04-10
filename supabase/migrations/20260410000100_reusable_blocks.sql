create table if not exists public.block_folders (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  parent_id uuid references public.block_folders(id) on delete cascade,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reusable_blocks (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  folder_id uuid references public.block_folders(id) on delete set null,
  block_type text not null,
  content jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_updated_at on public.block_folders;
create trigger set_updated_at
before update on public.block_folders
for each row
execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.reusable_blocks;
create trigger set_updated_at
before update on public.reusable_blocks
for each row
execute function public.set_updated_at();
