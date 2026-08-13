-- Keep It Going / 4EVER URS security baseline.
-- Apply this migration to the existing Supabase project.

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists admin_users_set_updated_at on public.admin_users;
create trigger admin_users_set_updated_at
before update on public.admin_users
for each row execute function public.set_updated_at();

create or replace function public.is_active_admin()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.admin_users au
    join auth.users u on u.id = au.user_id
    where au.user_id = auth.uid()
      and au.is_active = true
      and u.email_confirmed_at is not null
  );
$$;

revoke all on function public.is_active_admin() from public;
grant execute on function public.is_active_admin() to anon, authenticated;

alter table public.admin_users enable row level security;

do $$
declare
  policy_record record;
begin
  for policy_record in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in ('categories', 'memories', 'voice_notes', 'activities', 'couple_settings', 'admin_users')
  loop
    execute format('drop policy if exists %I on %I.%I', policy_record.policyname, policy_record.schemaname, policy_record.tablename);
  end loop;
end $$;

create policy "admins can read own admin record"
on public.admin_users
for select
to authenticated
using (user_id = auth.uid() and is_active = true);

create policy "public can read categories"
on public.categories
for select
to anon, authenticated
using (true);

create policy "admins can manage categories"
on public.categories
for all
to authenticated
using (public.is_active_admin())
with check (public.is_active_admin());

create policy "public can read memories"
on public.memories
for select
to anon, authenticated
using (true);

create policy "admins can manage memories"
on public.memories
for all
to authenticated
using (public.is_active_admin())
with check (public.is_active_admin());

create policy "public can read voice notes"
on public.voice_notes
for select
to anon, authenticated
using (true);

create policy "admins can manage voice notes"
on public.voice_notes
for all
to authenticated
using (public.is_active_admin())
with check (public.is_active_admin());

create policy "public can read activities"
on public.activities
for select
to anon, authenticated
using (true);

create policy "admins can manage activities"
on public.activities
for all
to authenticated
using (public.is_active_admin())
with check (public.is_active_admin());

create policy "public can read couple settings"
on public.couple_settings
for select
to anon, authenticated
using (true);

create policy "admins can manage couple settings"
on public.couple_settings
for all
to authenticated
using (public.is_active_admin())
with check (public.is_active_admin());

-- Replace only policies that reference this app's storage buckets.
do $$
declare
  policy_record record;
  policy_definition text;
begin
  for policy_record in
    select schemaname, tablename, policyname, qual, with_check
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
  loop
    policy_definition := coalesce(policy_record.qual, '') || ' ' || coalesce(policy_record.with_check, '');
    if policy_definition like '%memories-media%' or policy_definition like '%voice-notes-audio%' then
      execute format('drop policy if exists %I on %I.%I', policy_record.policyname, policy_record.schemaname, policy_record.tablename);
    end if;
  end loop;
end $$;

create policy "public can read memory media"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'memories-media');

create policy "admins can manage memory media"
on storage.objects
for all
to authenticated
using (bucket_id = 'memories-media' and public.is_active_admin())
with check (bucket_id = 'memories-media' and public.is_active_admin());

create policy "public can read voice note audio"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'voice-notes-audio');

create policy "admins can manage voice note audio"
on storage.objects
for all
to authenticated
using (bucket_id = 'voice-notes-audio' and public.is_active_admin())
with check (bucket_id = 'voice-notes-audio' and public.is_active_admin());

do $$
begin
  begin execute 'alter publication supabase_realtime add table public.categories'; exception when duplicate_object then null; end;
  begin execute 'alter publication supabase_realtime add table public.memories'; exception when duplicate_object then null; end;
  begin execute 'alter publication supabase_realtime add table public.voice_notes'; exception when duplicate_object then null; end;
  begin execute 'alter publication supabase_realtime add table public.activities'; exception when duplicate_object then null; end;
  begin execute 'alter publication supabase_realtime add table public.couple_settings'; exception when duplicate_object then null; end;
end $$;

-- After creating the first verified Supabase Auth user, add that user's UUID here:
-- insert into public.admin_users (user_id) values ('YOUR-AUTH-USER-UUID');
