-- Run this in Supabase SQL editor to persist YouTube learning notes per Clerk user.

create table if not exists public.learning_video_notes (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  video_id text not null,
  video_title text not null,
  topic text not null default 'All',
  content text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, video_id)
);

create index if not exists idx_learning_video_notes_user_updated
  on public.learning_video_notes(user_id, updated_at desc);

create table if not exists public.learning_video_note_versions (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  video_id text not null,
  video_title text not null,
  topic text not null default 'All',
  content text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists idx_learning_video_note_versions_user_video_created
  on public.learning_video_note_versions(user_id, video_id, created_at desc);
