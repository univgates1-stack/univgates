-- Automatically create public.users and public.students rows when a new auth user with role "student" is created
drop trigger if exists on_auth_user_created_student on auth.users;
drop function if exists public.handle_new_student_user();

create or replace function public.handle_new_student_user()
returns trigger
language plpgsql
security definer
set search_path = public
as
$$
declare
  is_student boolean := lower(coalesce(new.raw_user_meta_data ->> 'role', '')) = 'student';
  first_name text := nullif(new.raw_user_meta_data ->> 'first_name', '');
  last_name text := nullif(new.raw_user_meta_data ->> 'last_name', '');
begin
  if is_student then
    insert into public.users (id, email, first_name, last_name)
    values (new.id, new.email, first_name, last_name)
    on conflict (id) do update
      set email = excluded.email,
          first_name = coalesce(excluded.first_name, public.users.first_name),
          last_name = coalesce(excluded.last_name, public.users.last_name);

    insert into public.students (user_id, profile_completion_status)
    values (new.id, 'incomplete')
    on conflict (user_id) do nothing;
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created_student
  after insert on auth.users
  for each row execute function public.handle_new_student_user();
