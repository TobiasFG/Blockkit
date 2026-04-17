-- Move page identity into page_versions and replace global slug paths with parent-based path segments.

alter table public.page_versions
  add column if not exists title text,
  add column if not exists parent_page_id uuid null references public.pages(id) on delete restrict,
  add column if not exists url_name text,
  add column if not exists path_segment text;

with normalized_pages as (
  select
    id,
    title,
    case
      when coalesce(nullif(trim(slug), ''), '') = '' then ''
      else '/' || trim(both '/' from slug)
    end as normalized_slug
  from public.pages
),
parents as (
  select
    child.id as page_id,
    case
      when child.normalized_slug = '' then null
      when strpos(trim(both '/' from child.normalized_slug), '/') = 0 then root.id
      else parent.id
    end as parent_page_id,
    case
      when child.normalized_slug = '' then null
      else regexp_replace(trim(both '/' from child.normalized_slug), '^.*/', '')
    end as path_segment
  from normalized_pages child
  left join normalized_pages root on root.normalized_slug = ''
  left join normalized_pages parent
    on parent.normalized_slug = case
      when child.normalized_slug = '' then null
      when strpos(trim(both '/' from child.normalized_slug), '/') = 0 then ''
      else '/' || regexp_replace(trim(both '/' from child.normalized_slug), '/[^/]+$', '')
    end
)
update public.page_versions v
set
  title = np.title,
  parent_page_id = p.parent_page_id,
  url_name = p.path_segment,
  path_segment = p.path_segment
from normalized_pages np
join parents p on p.page_id = np.id
where v.page_id = np.id;

alter table public.page_versions
  alter column title set not null;

drop trigger if exists create_default_page_version on public.pages;
drop function if exists public.create_default_page_version();

drop index if exists page_versions_parent_status_segment_idx;
create unique index if not exists page_versions_status_parent_segment_uidx
  on public.page_versions(status, parent_page_id, path_segment)
  where status in ('draft', 'published') and path_segment is not null;

alter table public.pages
  drop column if exists title,
  drop column if exists slug;
