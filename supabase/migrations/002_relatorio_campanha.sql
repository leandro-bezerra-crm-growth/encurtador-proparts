-- Relatório por campanha: soma os cliques de todos os links de uma campanha nos últimos p_days dias.
-- Rode no SQL Editor do Supabase. Pode ser executado mais de uma vez.

create index if not exists clicks_clicked_at_idx on public.clicks (clicked_at desc);

create or replace function public.campaign_click_stats(p_campaign text, p_days int default 30)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with camp_links as (
    select id, slug, title from public.links where campaign = p_campaign
  ),
  period as (
    select c.*, l.slug
    from public.clicks c
    join camp_links l on l.id = c.link_id
    where c.clicked_at >= now() - make_interval(days => p_days)
  ),
  recent as (
    select * from period where device is distinct from 'bot'
  )
  select jsonb_build_object(
    'total', (select count(*) from recent),
    'bots', (select count(*) from period where device = 'bot'),
    'links', (select count(*) from camp_links),
    'by_day', coalesce((
      select jsonb_agg(jsonb_build_object('label', d, 'count', c) order by d desc)
      from (
        select to_char(clicked_at at time zone 'America/Sao_Paulo', 'YYYY-MM-DD') as d, count(*) as c
        from recent group by 1
      ) t
    ), '[]'::jsonb),
    'by_country', coalesce((
      select jsonb_agg(jsonb_build_object('label', k, 'count', c) order by c desc)
      from (select coalesce(country, '?') as k, count(*) as c from recent group by 1) t
    ), '[]'::jsonb),
    'by_device', coalesce((
      select jsonb_agg(jsonb_build_object('label', k, 'count', c) order by c desc)
      from (select coalesce(device, '?') as k, count(*) as c from recent group by 1) t
    ), '[]'::jsonb),
    'by_referrer', coalesce((
      select jsonb_agg(jsonb_build_object('label', k, 'count', c) order by c desc)
      from (select coalesce(referrer, 'direto') as k, count(*) as c from recent group by 1 order by c desc limit 20) t
    ), '[]'::jsonb),
    'by_link', coalesce((
      select jsonb_agg(jsonb_build_object('id', l.id, 'slug', l.slug, 'title', l.title, 'count', coalesce(r.c, 0))
                       order by coalesce(r.c, 0) desc, l.slug)
      from camp_links l
      left join (select link_id, count(*) as c from recent group by 1) r on r.link_id = l.id
    ), '[]'::jsonb),
    'by_day_link', coalesce((
      select jsonb_agg(jsonb_build_object('day', d, 'slug', slug, 'count', c) order by d desc, slug)
      from (
        select to_char(clicked_at at time zone 'America/Sao_Paulo', 'YYYY-MM-DD') as d, slug, count(*) as c
        from recent group by 1, 2
      ) t
    ), '[]'::jsonb)
  );
$$;

revoke execute on function public.campaign_click_stats(text, int) from public, anon, authenticated;
grant execute on function public.campaign_click_stats(text, int) to service_role;
