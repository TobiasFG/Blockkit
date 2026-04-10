insert into public.pages (title, slug)
values ('Home', '')
on conflict (slug) do nothing;
