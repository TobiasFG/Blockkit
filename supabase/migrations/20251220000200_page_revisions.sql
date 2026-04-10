-- Revision history + draft/publish workflow on top of page_versions.
-- Each "save" creates a new row; older drafts/published are archived.

alter table public.page_versions
  add column if not exists parent_id uuid null references public.page_versions(id) on delete set null,
  add column if not exists revision integer null;

create index if not exists page_versions_parent_id_idx on public.page_versions(parent_id);

create unique index if not exists page_versions_one_draft_per_page
  on public.page_versions(page_id)
  where status = 'draft';

create unique index if not exists page_versions_page_id_revision_idx
  on public.page_versions(page_id, revision)
  where revision is not null;

with ranked as (
  select
    id,
    page_id,
    row_number() over (partition by page_id order by created_at, id) as rev
  from public.page_versions
  where revision is null
)
update public.page_versions v
set revision = ranked.rev
from ranked
where v.id = ranked.id;

update public.page_versions v
set parent_id = p.draft_version_id
from public.pages p
where v.page_id = p.id
  and v.status = 'published'
  and v.parent_id is null
  and p.draft_version_id is not null;

create or replace function public.lock_page(_page_id uuid)
returns void
language plpgsql
as $$
begin
  perform pg_advisory_xact_lock(hashtext(_page_id::text));
end;
$$;

create or replace function public.save_page_draft(
  _page_id uuid,
  _content jsonb,
  _meta jsonb default '{}'::jsonb,
  _created_by uuid default auth.uid()
)
returns uuid
language plpgsql
as $$
declare
  v_prev_draft uuid;
  v_new_id uuid;
  v_next_rev integer;
begin
  perform public.lock_page(_page_id);

  select draft_version_id into v_prev_draft
  from public.pages
  where id = _page_id;

  if v_prev_draft is not null then
    update public.page_versions
    set status = 'archived'
    where id = v_prev_draft
      and status = 'draft';
  end if;

  select coalesce(max(revision), 0) + 1 into v_next_rev
  from public.page_versions
  where page_id = _page_id;

  insert into public.page_versions (page_id, status, content, meta, created_by, parent_id, revision)
  values (_page_id, 'draft', _content, _meta, _created_by, v_prev_draft, v_next_rev)
  returning id into v_new_id;

  update public.pages
  set draft_version_id = v_new_id
  where id = _page_id;

  return v_new_id;
end;
$$;

create or replace function public.publish_page(
  _page_id uuid,
  _meta jsonb default '{}'::jsonb,
  _created_by uuid default auth.uid()
)
returns uuid
language plpgsql
as $$
declare
  v_draft_id uuid;
  v_draft_content jsonb;
  v_new_id uuid;
  v_next_rev integer;
begin
  perform public.lock_page(_page_id);

  select draft_version_id into v_draft_id
  from public.pages
  where id = _page_id;

  if v_draft_id is null then
    raise exception 'Cannot publish page without a draft (%).', _page_id;
  end if;

  select content into v_draft_content
  from public.page_versions
  where id = v_draft_id;

  update public.page_versions
  set status = 'archived'
  where page_id = _page_id
    and status = 'published';

  select coalesce(max(revision), 0) + 1 into v_next_rev
  from public.page_versions
  where page_id = _page_id;

  insert into public.page_versions (page_id, status, content, meta, created_by, parent_id, revision, published_at)
  values (_page_id, 'published', v_draft_content, _meta, _created_by, v_draft_id, v_next_rev, now())
  returning id into v_new_id;

  update public.pages
  set published_version_id = v_new_id
  where id = _page_id;

  return v_new_id;
end;
$$;
