-- Ensure newly created pages get proper revision numbers and (optionally) an initial published snapshot.

create or replace function public.create_default_page_version()
returns trigger
language plpgsql
as $$
declare
  v_draft_id uuid;
  v_published_id uuid;
  v_default_content jsonb := '{"version":1,"blocks":[]}'::jsonb;
begin
  perform public.lock_page(new.id);

  insert into public.page_versions (page_id, status, content, revision)
  values (new.id, 'draft', v_default_content, 1)
  returning id into v_draft_id;

  if new.slug = '' then
    insert into public.page_versions (page_id, status, content, parent_id, revision, published_at)
    values (new.id, 'published', v_default_content, v_draft_id, 2, now())
    returning id into v_published_id;
  end if;

  update public.pages
  set draft_version_id = v_draft_id,
      published_version_id = v_published_id
  where id = new.id;

  return new;
end;
$$;

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

do $$
declare
  r record;
  v_new_pub uuid;
  v_next_rev integer;
begin
  for r in
    select p.id as page_id, p.draft_version_id, p.published_version_id
    from public.pages p
    join public.page_versions pv on pv.id = p.published_version_id
    where pv.status = 'draft'
  loop
    perform public.lock_page(r.page_id);

    select coalesce(max(revision), 0) + 1 into v_next_rev
    from public.page_versions
    where page_id = r.page_id;

    insert into public.page_versions (page_id, status, content, parent_id, revision, published_at)
    select r.page_id, 'published', content, r.draft_version_id, v_next_rev, now()
    from public.page_versions
    where id = r.draft_version_id
    returning id into v_new_pub;

    update public.pages
    set published_version_id = v_new_pub
    where id = r.page_id;
  end loop;
end $$;
