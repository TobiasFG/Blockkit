create or replace function public.publish_reusable_block(
  _reusable_block_id uuid
)
returns uuid
language plpgsql
as $$
declare
  v_draft_id uuid;
  v_draft_content jsonb;
  v_new_published_id uuid;
  v_new_draft_id uuid;
  v_next_rev integer;
begin
  perform public.lock_reusable_block(_reusable_block_id);

  select draft_version_id into v_draft_id
  from public.reusable_blocks
  where id = _reusable_block_id;

  if v_draft_id is null then
    raise exception 'Cannot publish reusable block without a draft (%).', _reusable_block_id;
  end if;

  select content into v_draft_content
  from public.reusable_block_versions
  where id = v_draft_id;

  if v_draft_content is null then
    raise exception 'Draft version % not found for reusable block %.', v_draft_id, _reusable_block_id;
  end if;

  update public.reusable_block_versions
  set status = 'archived'
  where reusable_block_id = _reusable_block_id
    and status = 'published';

  update public.reusable_block_versions
  set status = 'archived'
  where id = v_draft_id
    and status = 'draft';

  select coalesce(max(revision), 0) + 1 into v_next_rev
  from public.reusable_block_versions
  where reusable_block_id = _reusable_block_id;

  insert into public.reusable_block_versions (
    reusable_block_id,
    status,
    content,
    parent_id,
    revision,
    published_at
  )
  values (
    _reusable_block_id,
    'published',
    v_draft_content,
    v_draft_id,
    v_next_rev,
    now()
  )
  returning id into v_new_published_id;

  insert into public.reusable_block_versions (
    reusable_block_id,
    status,
    content,
    parent_id,
    revision
  )
  values (
    _reusable_block_id,
    'draft',
    v_draft_content,
    v_new_published_id,
    v_next_rev + 1
  )
  returning id into v_new_draft_id;

  update public.reusable_blocks
  set published_version_id = v_new_published_id,
      draft_version_id = v_new_draft_id,
      updated_at = now()
  where id = _reusable_block_id;

  return v_new_published_id;
end;
$$;

do $$
declare
  block_record record;
  v_draft_content jsonb;
  v_published_content jsonb;
  v_next_rev integer;
  v_new_draft_id uuid;
begin
  for block_record in
    select id, draft_version_id, published_version_id
    from public.reusable_blocks
    where draft_version_id is not null
      and published_version_id is not null
      and draft_version_id <> published_version_id
  loop
    select draft.content, published.content
      into v_draft_content, v_published_content
    from public.reusable_block_versions draft
    join public.reusable_block_versions published
      on published.id = block_record.published_version_id
    where draft.id = block_record.draft_version_id;

    if v_draft_content is distinct from v_published_content then
      continue;
    end if;

    update public.reusable_block_versions
    set status = 'archived'
    where id = block_record.draft_version_id
      and status = 'draft';

    select coalesce(max(revision), 0) + 1 into v_next_rev
    from public.reusable_block_versions
    where reusable_block_id = block_record.id;

    insert into public.reusable_block_versions (
      reusable_block_id,
      status,
      content,
      parent_id,
      revision
    )
    values (
      block_record.id,
      'draft',
      v_published_content,
      block_record.published_version_id,
      v_next_rev
    )
    returning id into v_new_draft_id;

    update public.reusable_blocks
    set draft_version_id = v_new_draft_id,
        updated_at = now()
    where id = block_record.id;
  end loop;
end;
$$;
