-- Virtual Lab communication platform schema
-- Run this in Supabase SQL editor after creating the project.

create extension if not exists "pgcrypto";

create type public.tenant_plan as enum ('free', 'pro');
create type public.tenant_role as enum ('admin', 'mod', 'user');
create type public.channel_type as enum ('text', 'voice');
create type public.moderation_action as enum ('warn', 'delete', 'allow');

create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  plan public.tenant_plan not null default 'free',
  created_at timestamptz not null default now()
);

create table public.users (
  id text primary key,
  name text not null,
  email text not null,
  avatar text,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  role public.tenant_role not null default 'user',
  engagement_score integer not null default 0,
  created_at timestamptz not null default now(),
  unique (tenant_id, email)
);

create table public.servers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  icon text,
  created_at timestamptz not null default now()
);

create table public.channels (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  server_id uuid not null references public.servers(id) on delete cascade,
  type public.channel_type not null,
  name text not null,
  created_at timestamptz not null default now()
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  channel_id uuid not null references public.channels(id) on delete cascade,
  user_id text not null,
  author_name text not null default 'Student',
  content text not null,
  created_at timestamptz not null default now(),
  edited_at timestamptz,
  deleted_at timestamptz
);

create table public.voice_sessions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  channel_id uuid not null references public.channels(id) on delete cascade,
  active_users text[] not null default '{}',
  started_at timestamptz not null default now(),
  ended_at timestamptz
);

create table public.ai_moderation_logs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  message_id uuid not null references public.messages(id) on delete cascade,
  action public.moderation_action not null,
  reason text not null,
  timestamp timestamptz not null default now()
);

create table public.engagement_metrics (
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id text not null,
  messages_count integer not null default 0,
  voice_minutes integer not null default 0,
  participation_score integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (tenant_id, user_id)
);

create index idx_users_tenant on public.users(tenant_id);
create index idx_servers_tenant on public.servers(tenant_id);
create index idx_channels_tenant_server on public.channels(tenant_id, server_id);
create index idx_messages_tenant_channel_created on public.messages(tenant_id, channel_id, created_at desc);
create index idx_voice_sessions_tenant_channel on public.voice_sessions(tenant_id, channel_id);
create index idx_moderation_tenant_message on public.ai_moderation_logs(tenant_id, message_id);
create index idx_engagement_leaderboard on public.engagement_metrics(tenant_id, participation_score desc);

alter table public.tenants enable row level security;
alter table public.users enable row level security;
alter table public.servers enable row level security;
alter table public.channels enable row level security;
alter table public.messages enable row level security;
alter table public.voice_sessions enable row level security;
alter table public.ai_moderation_logs enable row level security;
alter table public.engagement_metrics enable row level security;

-- MVP policies: client requests must set request.jwt.claims.tenant_id.
-- In production, map Clerk/Supabase auth claims to this tenant_id.
create policy "tenant users can read own tenant"
  on public.users for select
  using (tenant_id::text = auth.jwt() ->> 'tenant_id');

create policy "tenant users can read servers"
  on public.servers for select
  using (tenant_id::text = auth.jwt() ->> 'tenant_id');

create policy "tenant users can read channels"
  on public.channels for select
  using (tenant_id::text = auth.jwt() ->> 'tenant_id');

create policy "tenant users can read messages"
  on public.messages for select
  using (
    (tenant_id::text = auth.jwt() ->> 'tenant_id' or tenant_id = '11111111-1111-4111-8111-111111111111'::uuid)
    and deleted_at is null
  );

create policy "tenant users can insert messages"
  on public.messages for insert
  with check (
    tenant_id::text = auth.jwt() ->> 'tenant_id'
    or tenant_id = '11111111-1111-4111-8111-111111111111'::uuid
  );

create policy "tenant users can read voice sessions"
  on public.voice_sessions for select
  using (tenant_id::text = auth.jwt() ->> 'tenant_id');

create policy "tenant users can read engagement"
  on public.engagement_metrics for select
  using (tenant_id::text = auth.jwt() ->> 'tenant_id');

alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.voice_sessions;

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
