-- ============================================
-- MindOS: 7 Habits + GTD Productivity System
-- Supabase Schema
-- ============================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================
-- ROLES (7 Habits: Define your life roles)
-- ============================================
create table public.roles (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  description text,
  mission text, -- personal mission statement for this role
  color text default '#6366f1',
  sort_order int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================
-- CONTEXTS (GTD: Where/how you can do work)
-- ============================================
create table public.contexts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null, -- e.g., @work, @home, @phone, @computer
  icon text default '📍',
  created_at timestamptz default now()
);

-- ============================================
-- PROJECTS (GTD: Multi-step outcomes)
-- ============================================
create table public.projects (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  role_id uuid references public.roles(id) on delete set null,
  title text not null,
  description text,
  status text default 'active' check (status in ('active', 'completed', 'someday', 'archived')),
  desired_outcome text, -- GTD: What does "done" look like?
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================
-- TASKS (The core: Next Actions, Big Rocks, etc.)
-- ============================================
create table public.tasks (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  project_id uuid references public.projects(id) on delete set null,
  role_id uuid references public.roles(id) on delete set null,
  context_id uuid references public.contexts(id) on delete set null,
  title text not null,
  notes text,

  -- GTD fields
  status text default 'inbox' check (status in ('inbox', 'next_action', 'waiting_for', 'someday_maybe', 'reference', 'done', 'deleted')),
  waiting_for_whom text, -- if status = waiting_for
  delegated_date timestamptz,

  -- 7 Habits: Eisenhower Matrix
  quadrant int check (quadrant in (1, 2, 3, 4)),
  -- Q1: Urgent + Important (crises, deadlines)
  -- Q2: Not Urgent + Important (planning, relationships, prevention) ← THE SWEET SPOT
  -- Q3: Urgent + Not Important (interruptions, some meetings)
  -- Q4: Not Urgent + Not Important (time wasters)

  is_big_rock boolean default false, -- 7 Habits: Weekly Big Rock
  big_rock_week text, -- e.g., '2026-W12'

  -- Scheduling
  due_date date,
  scheduled_date date,
  energy_level text check (energy_level in ('high', 'medium', 'low')),
  estimated_minutes int,

  -- Email origin
  email_id text, -- Gmail message ID
  email_subject text,
  email_from text,

  completed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================
-- INBOX ITEMS (GTD: Capture everything first)
-- ============================================
create table public.inbox_items (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  notes text,
  source text default 'manual' check (source in ('manual', 'email', 'voice', 'calendar')),
  email_id text,
  email_subject text,
  email_from text,
  email_snippet text,
  processed boolean default false,
  created_at timestamptz default now()
);

-- ============================================
-- WEEKLY REVIEWS (7 Habits + GTD combined)
-- ============================================
create table public.weekly_reviews (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  week text not null, -- e.g., '2026-W12'

  -- GTD: Get Clear
  inbox_cleared boolean default false,

  -- GTD: Get Current
  next_actions_reviewed boolean default false,
  waiting_for_followed_up boolean default false,
  projects_reviewed boolean default false,
  someday_maybe_reviewed boolean default false,

  -- 7 Habits: Connect with Mission
  roles_reviewed boolean default false,
  big_rocks_set boolean default false,

  -- Reflection
  wins text, -- What went well?
  improvements text, -- What to improve?
  gratitude text,
  notes text,

  completed_at timestamptz,
  created_at timestamptz default now()
);

-- ============================================
-- JOURNAL (Daily reflections)
-- ============================================
create table public.journal_entries (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  date date default current_date,
  content text,
  mood text check (mood in ('great', 'good', 'okay', 'tough', 'bad')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================
-- Row Level Security
-- ============================================
alter table public.roles enable row level security;
alter table public.contexts enable row level security;
alter table public.projects enable row level security;
alter table public.tasks enable row level security;
alter table public.inbox_items enable row level security;
alter table public.weekly_reviews enable row level security;
alter table public.journal_entries enable row level security;

-- Users can only access their own data
create policy "Users can manage their own roles" on public.roles for all using (auth.uid() = user_id);
create policy "Users can manage their own contexts" on public.contexts for all using (auth.uid() = user_id);
create policy "Users can manage their own projects" on public.projects for all using (auth.uid() = user_id);
create policy "Users can manage their own tasks" on public.tasks for all using (auth.uid() = user_id);
create policy "Users can manage their own inbox" on public.inbox_items for all using (auth.uid() = user_id);
create policy "Users can manage their own reviews" on public.weekly_reviews for all using (auth.uid() = user_id);
create policy "Users can manage their own journal" on public.journal_entries for all using (auth.uid() = user_id);

-- ============================================
-- Default seed data function (called after signup)
-- ============================================
create or replace function public.seed_default_data()
returns trigger as $$
begin
  -- Default 7 Habits Roles
  insert into public.roles (user_id, name, description, color, sort_order) values
    (new.id, 'Professional', 'Career and work responsibilities', '#3b82f6', 1),
    (new.id, 'Family', 'Spouse, parent, child roles', '#ef4444', 2),
    (new.id, 'Personal Growth', 'Learning, health, spirituality', '#10b981', 3),
    (new.id, 'Community', 'Friends, volunteering, service', '#f59e0b', 4);

  -- Default GTD Contexts
  insert into public.contexts (user_id, name, icon) values
    (new.id, '@work', '💼'),
    (new.id, '@home', '🏠'),
    (new.id, '@phone', '📱'),
    (new.id, '@computer', '💻'),
    (new.id, '@errands', '🚗'),
    (new.id, '@anywhere', '🌍');

  return new;
end;
$$ language plpgsql security definer;

-- Trigger to seed data on new user signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.seed_default_data();

-- ============================================
-- Updated_at triggers
-- ============================================
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_roles_updated_at before update on public.roles for each row execute function public.update_updated_at();
create trigger update_projects_updated_at before update on public.projects for each row execute function public.update_updated_at();
create trigger update_tasks_updated_at before update on public.tasks for each row execute function public.update_updated_at();
create trigger update_journal_updated_at before update on public.journal_entries for each row execute function public.update_updated_at();
