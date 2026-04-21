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
  insert into public.reusable_blocks (name, block_type, folder_id, content)
  values (_name, _block_type, _folder_id, _content)
  returning id into v_block_id;

  insert into public.reusable_block_versions (reusable_block_id, status, content, revision)
  values (v_block_id, 'draft', _content, 1)
  returning id into v_draft_id;

  update public.reusable_blocks
  set draft_version_id = v_draft_id,
      updated_at = now()
  where id = v_block_id;

  return v_block_id;
end;
$$;
