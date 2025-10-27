-- Adds helper function to ensure a matching row exists in public.users for the signed-in auth user
create or replace function public.ensure_user_profile(p_email text, p_first_name text default null, p_last_name text default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as
$$
declare
  v_user_id uuid;
  v_row users%rowtype;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'ensure_user_profile must be called with a valid auth session';
  end if;

  insert into public.users (id, email, first_name, last_name)
  values (
    v_user_id,
    coalesce(nullif(p_email, ''), (auth.jwt() ->> 'email')),
    nullif(p_first_name, ''),
    nullif(p_last_name, '')
  )
  on conflict (id) do update
  set
    email = coalesce(excluded.email, public.users.email),
    first_name = coalesce(excluded.first_name, public.users.first_name),
    last_name = coalesce(excluded.last_name, public.users.last_name)
  returning * into v_row;

  return to_jsonb(v_row);
end;
$$;

grant execute on function public.ensure_user_profile(text, text, text) to authenticated, anon;
