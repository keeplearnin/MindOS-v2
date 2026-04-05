-- Health habit logs: daily BP readings + habit completions
-- Tracks Hari's BP health plan: cardio, sauna, breathing, mediterranean diet, no-news

create table if not exists health_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  date date not null default current_date,
  -- Blood pressure (optional — log when you take a reading)
  bp_systolic int check (bp_systolic between 60 and 250),
  bp_diastolic int check (bp_diastolic between 40 and 150),
  -- Habits completed today (array of habit keys)
  habits text[] default '{}',
  -- Optional note
  note text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  -- One log per user per day
  unique(user_id, date)
);

create index if not exists health_logs_user_date
  on health_logs(user_id, date desc);

alter table health_logs enable row level security;

create policy "Users can read own health logs"
  on health_logs for select
  using (auth.uid() = user_id);

create policy "Users can insert own health logs"
  on health_logs for insert
  with check (auth.uid() = user_id);

create policy "Users can update own health logs"
  on health_logs for update
  using (auth.uid() = user_id);

create policy "Users can delete own health logs"
  on health_logs for delete
  using (auth.uid() = user_id);

create trigger update_health_logs_updated_at
  before update on health_logs
  for each row execute function public.update_updated_at();
