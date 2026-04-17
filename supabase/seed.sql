do $$
declare
  v_page_id uuid;
  v_draft_id uuid;
  v_published_id uuid;
begin
  if exists (
    select 1
    from public.pages p
    join public.page_versions v on v.id = p.draft_version_id
    where v.parent_page_id is null
  ) then
    return;
  end if;

  insert into public.pages default values
  returning id into v_page_id;

  insert into public.page_versions (
    page_id,
    status,
    title,
    parent_page_id,
    url_name,
    path_segment,
    content,
    meta,
    revision
  )
  values (
    v_page_id,
    'draft',
    'Home',
    null,
    null,
    null,
    '{"version":1,"blocks":[]}'::jsonb,
    '{}'::jsonb,
    1
  )
  returning id into v_draft_id;

  insert into public.page_versions (
    page_id,
    status,
    title,
    parent_page_id,
    url_name,
    path_segment,
    content,
    meta,
    parent_id,
    revision,
    published_at
  )
  values (
    v_page_id,
    'published',
    'Home',
    null,
    null,
    null,
    '{"version":1,"blocks":[]}'::jsonb,
    '{}'::jsonb,
    v_draft_id,
    2,
    now()
  )
  returning id into v_published_id;

  update public.pages
  set draft_version_id = v_draft_id,
      published_version_id = v_published_id
  where id = v_page_id;
end $$;
