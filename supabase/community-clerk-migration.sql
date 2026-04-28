-- Run this once if you already executed the older communication schema.
-- It makes the community chat compatible with Clerk text user IDs and seeds
-- the default Virtual Lab workspace used by the app.

alter table if exists public.messages
  drop constraint if exists messages_user_id_fkey;

alter table if exists public.engagement_metrics
  drop constraint if exists engagement_metrics_user_id_fkey;

alter table if exists public.messages
  alter column user_id type text using user_id::text;

alter table if exists public.engagement_metrics
  alter column user_id type text using user_id::text;

alter table if exists public.voice_sessions
  alter column active_users type text[] using active_users::text[];

alter table if exists public.users
  alter column id drop default,
  alter column id type text using id::text;

alter table if exists public.messages
  add column if not exists author_name text not null default 'Student';

insert into public.tenants (id, name, plan)
values ('11111111-1111-4111-8111-111111111111', 'Virtual Lab School', 'free')
on conflict (id) do update set name = excluded.name;

insert into public.servers (id, tenant_id, name, icon)
values (
  '22222222-2222-4222-8222-222222222222',
  '11111111-1111-4111-8111-111111111111',
  'Campus',
  'VL'
)
on conflict (id) do update set name = excluded.name, icon = excluded.icon;

insert into public.channels (id, tenant_id, server_id, type, name)
values
  ('33333333-3333-4333-8333-333333333333', '11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222', 'text', 'general'),
  ('44444444-4444-4444-8444-444444444444', '11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222', 'text', 'java-course'),
  ('55555555-5555-4555-8555-555555555555', '11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222', 'text', 'python-course'),
  ('66666666-6666-4666-8666-666666666666', '11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222', 'voice', 'study-room')
on conflict (id) do update set name = excluded.name, type = excluded.type;

drop policy if exists "public can read default tenant messages" on public.messages;
create policy "public can read default tenant messages"
  on public.messages
  for select
  using (
    tenant_id = '11111111-1111-4111-8111-111111111111'::uuid
    and deleted_at is null
  );

drop policy if exists "public can insert default tenant messages" on public.messages;
create policy "public can insert default tenant messages"
  on public.messages
  for insert
  with check (tenant_id = '11111111-1111-4111-8111-111111111111'::uuid);

drop policy if exists "public can update own default tenant messages" on public.messages;
create policy "public can update own default tenant messages"
  on public.messages
  for update
  using (tenant_id = '11111111-1111-4111-8111-111111111111'::uuid)
  with check (tenant_id = '11111111-1111-4111-8111-111111111111'::uuid);

do $$
begin
  alter publication supabase_realtime add table public.messages;
exception
  when duplicate_object then null;
end $$;
