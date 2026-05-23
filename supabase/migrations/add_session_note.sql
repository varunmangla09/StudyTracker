-- Run in Supabase SQL Editor if you already created tables before session notes existed
alter table public.time_entries add column if not exists note text;
