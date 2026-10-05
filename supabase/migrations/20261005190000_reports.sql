-- Rapoartele anonime. Toate citirile și scrierile trec prin funcțiile de mai jos, apelate doar
-- de server cu cheia secretă. Browserul nu are acces la nimic (RLS activ, fără politici).

create table public.reports (
  id bigint generated always as identity primary key,
  city text not null check (city ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  zone text not null check (zone ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  service text not null check (service in ('apa', 'curent', 'gaz', 'caldura')),
  created_at timestamptz not null default now(),
  -- HMAC-SHA256 al adresei IP, în hex; devine null după 24 de ore (forget_old_ip_hashes)
  ip_hash text check (ip_hash ~ '^[0-9a-f]{64}$')
);

create index reports_city_zone_service_time on public.reports (city, zone, service, created_at desc);
create index reports_city_time on public.reports (city, created_at desc);

alter table public.reports enable row level security;

revoke all on table public.reports from public, anon, authenticated;

-- Un raport per (oraș, cartier, serviciu, amprentă) la 2 ore. Blocajul pe cheie face verificarea și
-- inserarea atomice: două cereri simultane identice nu pot trece amândouă.
create function public.submit_report(p_city text, p_zone text, p_service text, p_ip_hash text)
returns table (accepted boolean, retry_after timestamptz)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  last_at timestamptz;
begin
  if p_ip_hash is null then
    raise exception 'ip_hash lipsește';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_city || '|' || p_zone || '|' || p_service || '|' || p_ip_hash, 0)
  );

  select max(r.created_at) into last_at
  from public.reports r
  where r.city = p_city
    and r.zone = p_zone
    and r.service = p_service
    and r.ip_hash = p_ip_hash
    and r.created_at > now() - interval '2 hours';

  if last_at is not null then
    return query select false, last_at + interval '2 hours';
    return;
  end if;

  insert into public.reports (city, zone, service, ip_hash)
  values (p_city, p_zone, p_service, p_ip_hash);

  return query select true, null::timestamptz;
end;
$$;

-- Activitatea din ultimele 24 de ore, pe (cartier, serviciu): câte persoane distincte în ultima oră
-- și când a fost ultimul raport. Pragul de alertă stă în aplicație (src/lib/status.ts).
create function public.city_activity(p_city text)
returns table (zone text, service text, reporters_last_hour integer, last_report_at timestamptz)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    r.zone,
    r.service,
    (count(distinct r.ip_hash) filter (where r.created_at > now() - interval '1 hour'))::integer,
    max(r.created_at)
  from public.reports r
  where r.city = p_city
    and r.created_at > now() - interval '24 hours'
  group by r.zone, r.service
  order by r.zone, r.service;
$$;

-- Numărul de rapoarte pe intervale de 15 minute, ultimele 24 de ore (96 de valori, cea mai veche
-- prima, cu zerouri). p_zone null = tot orașul.
create function public.report_series(p_city text, p_service text, p_zone text)
returns table (bucket_start timestamptz, reports integer)
language sql
stable
security invoker
set search_path = ''
as $$
  with buckets as (
    select pg_catalog.generate_series(
      pg_catalog.date_bin('15 minutes', now(), timestamptz '2000-01-01') - interval '15 minutes' * 95,
      pg_catalog.date_bin('15 minutes', now(), timestamptz '2000-01-01'),
      interval '15 minutes'
    ) as start
  )
  select b.start, count(r.id)::integer
  from buckets b
  left join public.reports r
    on r.city = p_city
    and r.service = p_service
    and (p_zone is null or r.zone = p_zone)
    and r.created_at >= b.start
    and r.created_at < b.start + interval '15 minutes'
  group by b.start
  order by b.start;
$$;

-- Rulată zilnic de cron: șterge amprentele mai vechi de 24 de ore. Rapoartele rămân pentru istoric.
create function public.forget_old_ip_hashes()
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  changed integer;
begin
  update public.reports
  set ip_hash = null
  where ip_hash is not null
    and created_at < now() - interval '24 hours';

  get diagnostics changed = row_count;

  return changed;
end;
$$;

revoke all on function public.submit_report(text, text, text, text) from public, anon, authenticated;
revoke all on function public.city_activity(text) from public, anon, authenticated;
revoke all on function public.report_series(text, text, text) from public, anon, authenticated;
revoke all on function public.forget_old_ip_hashes() from public, anon, authenticated;

grant execute on function public.submit_report(text, text, text, text) to service_role;
grant execute on function public.city_activity(text) to service_role;
grant execute on function public.report_series(text, text, text) to service_role;
grant execute on function public.forget_old_ip_hashes() to service_role;
