-- Dashboard v2: igual à 003, mais "prev_by_day" (cliques do período anterior alinhados dia a dia),
-- usado na linha pontilhada "Período anterior" do gráfico. Rode no SQL Editor do Supabase.

create or replace function public.dashboard_stats(p_days int default 30)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with bounds as (
    select now() - make_interval(days => p_days) as since,
           now() - make_interval(days => p_days * 2) as prev_since
  ),
  cur as (
    select c.link_id, c.clicked_at, c.device, c.referrer, l.slug, l.title, l.campaign
    from public.clicks c
    join public.links l on l.id = c.link_id
    cross join bounds b
    where c.clicked_at >= b.since and c.device is distinct from 'bot'
  ),
  days as (
    select d::date as day
    from bounds b,
         generate_series((b.since at time zone 'America/Sao_Paulo')::date,
                         (now() at time zone 'America/Sao_Paulo')::date,
                         interval '1 day') d
  )
  select jsonb_build_object(
    'total', (select count(*) from cur),
    'previous', (
      select count(*) from public.clicks c, bounds b
      where c.clicked_at >= b.prev_since and c.clicked_at < b.since and c.device is distinct from 'bot'
    ),
    'bots', (
      select count(*) from public.clicks c, bounds b
      where c.clicked_at >= b.since and c.device = 'bot'
    ),
    'active_links', (select count(*) from public.links where active),
    'links_with_clicks', (select count(distinct link_id) from cur),
    'campaigns_with_clicks', (select count(distinct campaign) from cur where campaign is not null),
    'by_day', coalesce((
      select jsonb_agg(jsonb_build_object('label', to_char(d.day, 'YYYY-MM-DD'), 'count', coalesce(x.c, 0)) order by d.day)
      from days d
      left join (
        select (clicked_at at time zone 'America/Sao_Paulo')::date as day, count(*) as c from cur group by 1
      ) x on x.day = d.day
    ), '[]'::jsonb),
    'prev_by_day', coalesce((
      select jsonb_agg(coalesce(x.c, 0) order by d.day)
      from days d
      left join (
        select (c.clicked_at at time zone 'America/Sao_Paulo')::date as day, count(*) as c
        from public.clicks c, bounds b
        where c.clicked_at >= b.prev_since - interval '1 day' and c.clicked_at < b.since
          and c.device is distinct from 'bot'
        group by 1
      ) x on x.day = d.day - p_days
    ), '[]'::jsonb),
    'by_campaign', coalesce((
      select jsonb_agg(jsonb_build_object('label', k, 'count', c) order by c desc)
      from (select coalesce(campaign, '(sem campanha)') as k, count(*) as c from cur group by 1 order by c desc limit 10) t
    ), '[]'::jsonb),
    'by_referrer', coalesce((
      select jsonb_agg(jsonb_build_object('label', k, 'count', c) order by c desc)
      from (select coalesce(referrer, 'direto') as k, count(*) as c from cur group by 1 order by c desc limit 8) t
    ), '[]'::jsonb),
    'by_device', coalesce((
      select jsonb_agg(jsonb_build_object('label', k, 'count', c) order by c desc)
      from (select coalesce(device, '?') as k, count(*) as c from cur group by 1) t
    ), '[]'::jsonb),
    'top_links', coalesce((
      select jsonb_agg(jsonb_build_object('id', link_id, 'slug', slug, 'title', title, 'campaign', campaign, 'count', c) order by c desc)
      from (select link_id, slug, title, campaign, count(*) as c from cur group by 1, 2, 3, 4 order by c desc limit 10) t
    ), '[]'::jsonb)
  );
$$;

revoke execute on function public.dashboard_stats(int) from public, anon, authenticated;
grant execute on function public.dashboard_stats(int) to service_role;
