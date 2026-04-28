create table if not exists public.audio_study_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  activity text not null check (activity in ('coding', 'reading', 'browsing', 'watching', 'idle')),
  page_context text not null,
  topic_context text not null,
  active_learning_minutes integer not null default 0,
  idle_minutes integer not null default 0,
  session_duration_minutes integer not null default 0,
  interaction_count integer not null default 0,
  engagement_score integer not null default 0,
  focus_score integer not null default 0,
  fatigue_score integer not null default 0,
  started_at timestamptz not null default now(),
  ended_at timestamptz
);

create table if not exists public.audio_recommendation_events (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.audio_study_sessions(id) on delete cascade,
  user_id text not null,
  recommendation_type text not null check (recommendation_type in ('focus', 'podcast', 'mixed')),
  reason text not null,
  action text not null,
  items jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audio_study_sessions_user_started_idx
  on public.audio_study_sessions(user_id, started_at desc);

create index if not exists audio_recommendation_events_user_created_idx
  on public.audio_recommendation_events(user_id, created_at desc);

alter table public.audio_study_sessions enable row level security;
alter table public.audio_recommendation_events enable row level security;

create policy "Users can read their own audio sessions"
  on public.audio_study_sessions
  for select
  using (user_id = auth.jwt() ->> 'sub');

create policy "Users can insert their own audio sessions"
  on public.audio_study_sessions
  for insert
  with check (user_id = auth.jwt() ->> 'sub');

create policy "Users can read their own recommendation events"
  on public.audio_recommendation_events
  for select
  using (user_id = auth.jwt() ->> 'sub');

create policy "Users can insert their own recommendation events"
  on public.audio_recommendation_events
  for insert
  with check (user_id = auth.jwt() ->> 'sub');
