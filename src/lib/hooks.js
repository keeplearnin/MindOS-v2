'use client';

import useSWR, { mutate as globalMutate } from 'swr';
import { getSupabase } from './supabase-browser';

// ─── SWR Fetcher ───────────────────────────────────────────────
// Builds a Supabase query from a structured key and returns data.
// Key format: [table, filtersJSON, orderBy, ascending]

async function supabaseFetcher([table, filtersJSON, orderBy, ascending]) {
  const supabase = getSupabase();
  let query = supabase.from(table).select('*');

  const filters = JSON.parse(filtersJSON);
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query = query.eq(key, value);
    }
  });

  if (orderBy) query = query.order(orderBy, { ascending });

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

// ─── Generic Hook ──────────────────────────────────────────────
// Replaces the old useSupabaseQuery with SWR-powered caching.
//
// Benefits:
//   - Deduplicates identical requests (roles, contexts loaded once even if 5 components call useRoles)
//   - Caches results — navigating back to a page shows data instantly
//   - Background revalidation — stale data shows immediately, fresh data swaps in
//   - Stable key via pre-serialized filtersJSON — no JSON.stringify in dependency array

export function useSupabaseQuery(table, options = {}) {
  const { filters = {}, orderBy = 'created_at', ascending = false, enabled = true } = options;

  // Pre-serialize filters once so the SWR key is stable across renders
  const filtersJSON = JSON.stringify(filters);
  const key = enabled ? [table, filtersJSON, orderBy, ascending] : null;

  const { data, error, isLoading, mutate } = useSWR(key, supabaseFetcher, {
    // Roles/contexts/projects rarely change — keep cached for 5 minutes
    dedupingInterval: table === 'tasks' || table === 'inbox_items' ? 2000 : 60000,
    revalidateOnFocus: table === 'tasks' || table === 'inbox_items',
    // Show stale data while revalidating
    keepPreviousData: true,
  });

  return {
    data: data || [],
    loading: isLoading,
    error,
    refetch: () => mutate(),
  };
}

// ─── Specific Hooks ────────────────────────────────────────────
// Each returns the same { data, loading, error, refetch } shape.

export function useTasks(filters = {}) {
  return useSupabaseQuery('tasks', {
    filters,
    orderBy: 'created_at',
    ascending: false,
  });
}

export function useInbox() {
  return useSupabaseQuery('inbox_items', {
    filters: { processed: false },
    orderBy: 'created_at',
    ascending: false,
  });
}

export function useProjects(status = 'active') {
  return useSupabaseQuery('projects', {
    filters: { status },
    orderBy: 'updated_at',
    ascending: false,
  });
}

export function useRoles() {
  return useSupabaseQuery('roles', {
    orderBy: 'sort_order',
    ascending: true,
  });
}

export function useContexts() {
  return useSupabaseQuery('contexts', {
    orderBy: 'name',
    ascending: true,
  });
}

// ─── Mutation Helpers ──────────────────────────────────────────
// After each mutation, invalidate the relevant SWR cache so all
// components using that data re-render with fresh results.

function invalidate(table) {
  // Invalidate all SWR keys that start with this table name
  globalMutate(
    (key) => Array.isArray(key) && key[0] === table,
    undefined,
    { revalidate: true }
  );
}

export async function createTask(task) {
  const supabase = getSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from('tasks')
    .insert({ ...task, user_id: user.id })
    .select()
    .single();
  if (error) throw error;
  invalidate('tasks');
  return data;
}

export async function updateTask(id, updates) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  invalidate('tasks');
  return data;
}

export async function deleteTask(id) {
  const supabase = getSupabase();
  const { error } = await supabase.from('tasks').delete().eq('id', id);
  if (error) throw error;
  invalidate('tasks');
}

export async function createInboxItem(item) {
  const supabase = getSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from('inbox_items')
    .insert({ ...item, user_id: user.id })
    .select()
    .single();
  if (error) throw error;
  invalidate('inbox_items');
  return data;
}

export async function processInboxItem(id) {
  const supabase = getSupabase();
  const { error } = await supabase
    .from('inbox_items')
    .update({ processed: true })
    .eq('id', id);
  if (error) throw error;
  invalidate('inbox_items');
}

export async function createProject(project) {
  const supabase = getSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from('projects')
    .insert({ ...project, user_id: user.id })
    .select()
    .single();
  if (error) throw error;
  invalidate('projects');
  return data;
}

// ─── Mood Entries ──────────────────────────────────────────────

export function useMoodEntries(limit = 50) {
  const key = ['mood_entries_recent', limit];
  const { data, error, isLoading, mutate } = useSWR(key, async () => {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('mood_entries')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data || [];
  }, { dedupingInterval: 5000 });

  return { data: data || [], loading: isLoading, error, refetch: () => mutate() };
}

export function useJournalEntries(limit = 30) {
  const key = ['journal_entries_recent', limit];
  const { data, error, isLoading } = useSWR(key, async () => {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('journal_entries')
      .select('id, date, mood, content, created_at')
      .order('date', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data || [];
  }, { dedupingInterval: 10000 });

  return { data: data || [], loading: isLoading, error };
}

export async function createMoodEntry(entry) {
  const supabase = getSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from('mood_entries')
    .insert({ ...entry, user_id: user.id })
    .select()
    .single();
  if (error) throw error;
  // Invalidate mood entries cache
  globalMutate(
    (key) => Array.isArray(key) && key[0] === 'mood_entries_recent',
    undefined,
    { revalidate: true }
  );
  return data;
}

// ─── Health Logs ───────────────────────────────────────────────

export function useHealthLogs(limit = 90) {
  const key = ['health_logs_recent', limit];
  const { data, error, isLoading, mutate } = useSWR(key, async () => {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('health_logs')
      .select('*')
      .order('date', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data || [];
  }, { dedupingInterval: 5000 });

  return { data: data || [], loading: isLoading, error, refetch: () => mutate() };
}

export async function upsertHealthLog({ date, habits, bp_systolic, bp_diastolic, note }) {
  const supabase = getSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  const payload = { user_id: user.id, date, habits, note: note || null };
  if (bp_systolic) payload.bp_systolic = bp_systolic;
  if (bp_diastolic) payload.bp_diastolic = bp_diastolic;

  const { data, error } = await supabase
    .from('health_logs')
    .upsert(payload, { onConflict: 'user_id,date' })
    .select()
    .single();
  if (error) throw error;

  globalMutate(
    (key) => Array.isArray(key) && key[0] === 'health_logs_recent',
    undefined,
    { revalidate: true }
  );
  return data;
}

export async function updateProject(id, updates) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('projects')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  invalidate('projects');
  return data;
}
