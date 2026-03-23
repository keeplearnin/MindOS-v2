-- Mood check-in entries (separate from daily journal)
-- Quick micro-journal for logging how you feel throughout the day

create table if not exists mood_entries (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  mood int not null check (mood between 1 and 5),
  emoji text not null,
  energy int check (energy between 1 and 5),
  note text,
  tags text[] default '{}',
  created_at timestamptz default now() not null
);

-- Index for fast queries by user + time
create index if not exists mood_entries_user_created
  on mood_entries(user_id, created_at desc);

-- RLS
alter table mood_entries enable row level security;

create policy "Users can read own mood entries"
  on mood_entries for select
  using (auth.uid() = user_id);

create policy "Users can insert own mood entries"
  on mood_entries for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own mood entries"
  on mood_entries for delete
  using (auth.uid() = user_id);
