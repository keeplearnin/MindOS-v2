-- ============================================
-- Recurring Tasks Support
-- ============================================

-- recurrence_rule: null = one-off, otherwise frequency
-- recurrence_interval: every N periods (e.g., 2 + weekly = biweekly)
-- parent_task_id: links spawned instances to the original recurring task

alter table public.tasks
  add column if not exists recurrence_rule text check (recurrence_rule in ('daily', 'weekly', 'monthly', 'yearly')),
  add column if not exists recurrence_interval int default 1,
  add column if not exists parent_task_id uuid references public.tasks(id) on delete set null;
