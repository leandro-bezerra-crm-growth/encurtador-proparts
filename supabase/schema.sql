-- Encurtador Proparts: estrutura do banco (Supabase / Postgres)
-- Rode este arquivo inteiro no SQL Editor do Supabase. Pode ser executado mais de uma vez.

-- Links curtos
create table if not exists public.links (
  id            bigint generated always as identity primary key,
  slug          text not null unique check (slug ~ '^[A-Za-z0-9_-]{2,64}$'),
  url           text not null check (url ~* '^https?://'),
  title         text,
  campaign      text,
  utm_source    text,
  utm_medium    text,
  utm_campaign  text,
  utm_content   text,
  utm_term      text,
  active        boolean not null default true,
  clicks        bigint not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists links_campaign_idx on public.links (campaign);
create index if not exists links_created_at_idx on public.links (created_at desc);

-- Cliques (sem IP nem dados pessoais: apenas país, tipo de dispositivo e site de origem)
create table if not exists public.clicks (
  id          bigint generated always as identity primary key,
  link_id     bigint not null references public.links (id) on delete cascade,
  clicked_at  timestamptz not null default now(),
  country     text,
  device      text,
  referrer    text
);

create index if not exists clicks_link_id_clicked_at_idx on public.clicks (link_id, clicked_at desc);

-- Segurança: RLS ligado e nenhuma policy.
-- Só a chave secreta (service role), usada no servidor da Vercel, consegue ler e gravar.
alter table public.links enable row level security;
alter table public.clicks enable row level security;

-- Registra um clique e incrementa o contador do link de forma atômica.
-- Robôs e pré-visualizações (device = 'bot') ficam registrados, mas não contam como clique.
create or replace function public.register_click(
  p_link_id  bigint,
  p_country  text,
  p_device   text,
  p_referrer text
) returns void
language sql
security definer
set search_path = public
as $$
  insert into public.clicks (link_id, country, device, referrer)
  values (p_link_id, p_country, p_device, p_referrer);

  update public.links set clicks = clicks + 1
  where id = p_link_id and p_device is distinct from 'bot';
$$;

-- Resumo de cliques de um link nos últimos p_days dias (datas no fuso de São Paulo), sem robôs
create or replace function public.link_click_stats(p_link_id bigint, p_days int default 30)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with period as (
    select * from public.clicks
    where link_id = p_link_id
      and clicked_at >= now() - make_interval(days => p_days)
  ),
  recent as (
    select * from period where device is distinct from 'bot'
  )
  select jsonb_build_object(
    'total', (select count(*) from recent),
    'bots', (select count(*) from period where device = 'bot'),
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
    ), '[]'::jsonb)
  );
$$;

-- As funções só podem ser chamadas pelo servidor (service role)
revoke execute on function public.register_click(bigint, text, text, text) from public, anon, authenticated;
revoke execute on function public.link_click_stats(bigint, int) from public, anon, authenticated;
grant execute on function public.register_click(bigint, text, text, text) to service_role;
grant execute on function public.link_click_stats(bigint, int) to service_role;
