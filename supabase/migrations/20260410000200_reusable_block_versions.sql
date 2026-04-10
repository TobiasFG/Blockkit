alter table public.reusable_blocks
  add column if not exists draft_version_id uuid null,
  add column if not exists published_version_id uuid null;

create table if not exists public.reusable_block_versions (
  id uuid primary key default gen_random_uuid(),
  reusable_block_id uuid not null references public.reusable_blocks(id) on delete cascade,
  status text not null check (status in ('draft', 'published', 'archived')),
  content jsonb not null,
  parent_id uuid null references public.reusable_block_versions(id) on delete set null,
  revision integer not null,
  created_at timestamptz not null default now(),
  published_at timestamptz null default null
);

create index if not exists reusable_block_versions_reusable_block_id_idx
  on public.reusable_block_versions(reusable_block_id);

create index if not exists reusable_block_versions_parent_id_idx
  on public.reusable_block_versions(parent_id);

create unique index if not exists reusable_block_versions_one_draft_per_block
  on public.reusable_block_versions(reusable_block_id)
  where status = 'draft';

create unique index if not exists reusable_block_versions_one_published_per_block
  on public.reusable_block_versions(reusable_block_id)
  where status = 'published';

create unique index if not exists reusable_block_versions_block_revision_idx
  on public.reusable_block_versions(reusable_block_id, revision);

alter table public.reusable_blocks
  add constraint reusable_blocks_draft_version_id_fkey
  foreign key (draft_version_id) references public.reusable_block_versions(id) on delete set null;

alter table public.reusable_blocks
  add constraint reusable_blocks_published_version_id_fkey
  foreign key (published_version_id) references public.reusable_block_versions(id) on delete set null;

create or replace function public.lock_reusable_block(_reusable_block_id uuid)
returns void
language plpgsql
as $$
begin
  perform pg_advisory_xact_lock(hashtext(_reusable_block_id::text));
end;
$$;

create or replace function public.create_reusable_block(
  _name text,
  _block_type text,
  _folder_id uuid default null,
  _content jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
as $$
declare
  v_block_id uuid;
  v_draft_id uuid;
begin
  insert into public.reusable_blocks (name, block_type, folder_id)
  values (_name, _block_type, _folder_id)
  returning id into v_block_id;

  insert into public.reusable_block_versions (reusable_block_id, status, content, revision)
  values (v_block_id, 'draft', _content, 1)
  returning id into v_draft_id;

  update public.reusable_blocks
  set draft_version_id = v_draft_id
  where id = v_block_id;

  return v_block_id;
end;
$$;

create or replace function public.save_reusable_block_draft(
  _reusable_block_id uuid,
  _content jsonb
)
returns uuid
language plpgsql
as $$
declare
  v_prev_draft uuid;
  v_new_id uuid;
  v_next_rev integer;
begin
  perform public.lock_reusable_block(_reusable_block_id);

  select draft_version_id into v_prev_draft
  from public.reusable_blocks
  where id = _reusable_block_id;

  if v_prev_draft is not null then
    update public.reusable_block_versions
    set status = 'archived'
    where id = v_prev_draft
      and status = 'draft';
  end if;

  select coalesce(max(revision), 0) + 1 into v_next_rev
  from public.reusable_block_versions
  where reusable_block_id = _reusable_block_id;

  insert into public.reusable_block_versions (reusable_block_id, status, content, parent_id, revision)
  values (_reusable_block_id, 'draft', _content, v_prev_draft, v_next_rev)
  returning id into v_new_id;

  update public.reusable_blocks
  set draft_version_id = v_new_id
  where id = _reusable_block_id;

  return v_new_id;
end;
$$;

create or replace function public.publish_reusable_block(
  _reusable_block_id uuid
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
  returning id into v_new_id;

  update public.reusable_blocks
  set published_version_id = v_new_id
  where id = _reusable_block_id;

  return v_new_id;
end;
$$;

do $$
declare
  block_record record;
  v_draft_id uuid;
  v_published_id uuid;
begin
  for block_record in
    select id, content
    from public.reusable_blocks
    where draft_version_id is null
      and published_version_id is null
  loop
    insert into public.reusable_block_versions (reusable_block_id, status, content, revision)
    values (block_record.id, 'draft', block_record.content, 1)
    returning id into v_draft_id;

    insert into public.reusable_block_versions (
      reusable_block_id,
      status,
      content,
      parent_id,
      revision,
      published_at
    )
    values (block_record.id, 'published', block_record.content, v_draft_id, 2, now())
    returning id into v_published_id;

    update public.reusable_blocks
    set draft_version_id = v_draft_id,
        published_version_id = v_published_id
    where id = block_record.id;
  end loop;
end;
$$;
