-- Hoeveel mensen spelen dit spel? Geen namen, alleen een willekeurig nummer
-- dat de app zelf verzint. Los van de clubs: iedereen telt mee, ook wie geen
-- club heeft.

create table if not exists public.freecell_spelers (
  speler_id text primary key,
  eerst     timestamptz not null default now(),
  gezien    timestamptz not null default now()
);
create index if not exists freecell_spelers_gezien on public.freecell_spelers (gezien desc);

alter table public.freecell_spelers enable row level security;
revoke all on public.freecell_spelers from anon, authenticated;

create or replace function public.freecell_speler_ping(p_id text)
returns table (nu bigint, vandaag bigint, week bigint, totaal bigint)
language plpgsql security definer set search_path = public as $$
begin
  if p_id is not null and length(p_id) between 6 and 64 then
    insert into public.freecell_spelers (speler_id) values (p_id)
    on conflict (speler_id) do update set gezien = now();
  end if;
  return query
    select (select count(*) from public.freecell_spelers s where s.gezien > now() - interval '3 minutes'),
           (select count(*) from public.freecell_spelers s where s.gezien > now() - interval '1 day'),
           (select count(*) from public.freecell_spelers s where s.gezien > now() - interval '7 days'),
           (select count(*) from public.freecell_spelers);
end;
$$;

grant execute on function public.freecell_speler_ping(text) to anon, authenticated;
