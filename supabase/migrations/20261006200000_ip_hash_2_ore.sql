-- #48: amprenta IP se păstrează doar cât o cere limita de 2 ore. E un HMAC cu cheie fixă: cine are
-- cheia poate încerca toate cele ~4 miliarde de adrese IPv4 și afla adresa cât timp amprenta există.
-- Numărarea persoanelor diferite folosește doar ultima oră, deci 2 ore ajung pentru amândouă.

create or replace function public.forget_old_ip_hashes()
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
    and created_at < now() - interval '2 hours';

  get diagnostics changed = row_count;

  return changed;
end;
$$;

-- Rulează în Postgres la 15 minute (amprenta trăiește cel mult ~2 ore și un sfert). Vercel Hobby
-- permite un singur cron pe zi, folosit deja ca baza să nu fie pusă pe pauză; acela rămâne rezervă.
create extension if not exists pg_cron with schema pg_catalog;

select cron.schedule('sterge-amprente-ip', '*/15 * * * *', 'select public.forget_old_ip_hashes()');
