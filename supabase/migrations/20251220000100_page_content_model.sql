-- Adds a versioned content model for pages (draft/publish ready).

create table if not exists public.page_versions (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references public.pages(id) on delete cascade,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  content jsonb not null default '{"version":1,"blocks":[]}'::jsonb,
  meta jsonb not null default '{}'::jsonb,
  created_by uuid null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz null,
  constraint page_versions_content_shape check (
    jsonb_typeof(content) = 'object'
    and content ? 'blocks'
    and jsonb_typeof(content->'blocks') = 'array'
  )
);

create index if not exists page_versions_page_id_idx on public.page_versions(page_id);
create index if not exists page_versions_status_idx on public.page_versions(status);

create unique index if not exists page_versions_one_published_per_page
  on public.page_versions(page_id)
  where status = 'published';

drop trigger if exists set_updated_at on public.page_versions;
create trigger set_updated_at
before update on public.page_versions
for each row
execute function public.set_updated_at();

alter table public.pages
  add column if not exists draft_version_id uuid null references public.page_versions(id),
  add column if not exists published_version_id uuid null references public.page_versions(id);

create index if not exists pages_draft_version_id_idx on public.pages(draft_version_id);
create index if not exists pages_published_version_id_idx on public.pages(published_version_id);

create or replace function public.create_default_page_version()
returns trigger
language plpgsql
as $$
declare
  v_version_id uuid;
begin
  insert into public.page_versions (page_id, status)
  values (new.id, 'draft')
  returning id into v_version_id;

  update public.pages
  set draft_version_id = v_version_id,
      published_version_id = case when new.slug = '' then v_version_id else published_version_id end
  where id = new.id;

  return new;
end;
$$;

drop trigger if exists create_default_page_version on public.pages;
create trigger create_default_page_version
after insert on public.pages
for each row
execute function public.create_default_page_version();

with inserted as (
  insert into public.page_versions (page_id, status)
  select p.id, 'draft'
  from public.pages p
  where p.draft_version_id is null
  returning id, page_id
)
update public.pages p
set draft_version_id = ins.id
from inserted ins
where p.id = ins.page_id;

update public.pages
set published_version_id = draft_version_id
where published_version_id is null;
