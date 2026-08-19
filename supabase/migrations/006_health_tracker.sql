-- Function Health protocol tracker: daily metrics + a proper biomarker history table.
-- Safe to run more than once: every statement is idempotent.
-- health_logs already covers habits/note per day; this adds free-form numeric
-- metrics to that same row and a dedicated table for lab results over time.

alter table health_logs add column if not exists metrics jsonb not null default '{}'::jsonb;

create table if not exists health_biomarkers (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  marker_id text not null,
  value numeric not null,
  date date not null,
  created_at timestamptz default now() not null,
  -- one reading per marker per day; re-importing the same draw just updates it
  unique(user_id, marker_id, date)
);

create index if not exists health_biomarkers_user_marker
  on health_biomarkers(user_id, marker_id, date desc);

alter table health_biomarkers enable row level security;

drop policy if exists "Users can read own biomarkers" on health_biomarkers;
create policy "Users can read own biomarkers"
  on health_biomarkers for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own biomarkers" on health_biomarkers;
create policy "Users can insert own biomarkers"
  on health_biomarkers for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own biomarkers" on health_biomarkers;
create policy "Users can update own biomarkers"
  on health_biomarkers for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete own biomarkers" on health_biomarkers;
create policy "Users can delete own biomarkers"
  on health_biomarkers for delete
  using (auth.uid() = user_id);
