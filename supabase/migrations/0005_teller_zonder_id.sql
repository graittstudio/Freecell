-- Ook kunnen kijken zonder zelf mee te tellen (bijvoorbeeld vanaf de
-- landingspagina): p_id mag weggelaten worden.
create or replace function public.freecell_speler_ping(p_id text default null)
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
