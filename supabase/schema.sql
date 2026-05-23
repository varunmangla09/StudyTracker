-- Run this in Supabase SQL Editor (Dashboard → SQL → New query)

-- Topics: timer (track time) or habit (tap for daily streak)
create table if not exists public.topics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type text not null check (type in ('timer', 'habit')),
  color text not null default '#6366f1',
  category text not null default 'General',
  created_at timestamptz not null default now()
);

-- Time sessions for timer topics
create table if not exists public.time_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  topic_id uuid not null references public.topics(id) on delete cascade,
  started_at timestamptz not null,
  ended_at timestamptz,
  duration_seconds integer,
  created_at timestamptz not null default now()
);

-- One row per habit completion per day
create table if not exists public.habit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  topic_id uuid not null references public.topics(id) on delete cascade,
  log_date date not null,
  created_at timestamptz not null default now(),
  unique (user_id, topic_id, log_date)
);

-- User goals and preferences
create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  weekday_goal_minutes integer not null default 120,
  weekend_min_goal_minutes integer not null default 240,
  weekend_max_goal_minutes integer not null default 360,
  reminder_enabled boolean not null default false,
  reminder_time text not null default '09:00',
  goal_alert_enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.topics enable row level security;
alter table public.time_entries enable row level security;
alter table public.habit_logs enable row level security;
alter table public.user_settings enable row level security;

create policy "topics_own" on public.topics for all using (auth.uid() = user_id);
create policy "time_entries_own" on public.time_entries for all using (auth.uid() = user_id);
create policy "habit_logs_own" on public.habit_logs for all using (auth.uid() = user_id);
create policy "settings_own" on public.user_settings for all using (auth.uid() = user_id);

-- Auto-create settings on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.user_settings (user_id) values (new.id);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create index if not exists idx_time_entries_user_started on public.time_entries (user_id, started_at);
create index if not exists idx_habit_logs_user_date on public.habit_logs (user_id, log_date);
