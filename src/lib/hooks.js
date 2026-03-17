'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSupabase } from './supabase-browser';

// Generic hook to fetch data from Supabase
export function useSupabaseQuery(table, options = {}) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { filters = {}, orderBy = 'created_at', ascending = false, enabled = true } = options;

  const fetch = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    const supabase = getSupabase();
    let query = supabase.from(table).select('*');

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query = query.eq(key, value);
      }
    });

    if (orderBy) query = query.order(orderBy, { ascending });

    const { data, error } = await query;
    if (error) setError(error);
    else setData(data || []);
    setLoading(false);
  }, [table, JSON.stringify(filters), orderBy, ascending, enabled]);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

// Task-specific hooks
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

// Mutation helpers
export async function createTask(task) {
  const supabase = getSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from('tasks')
    .insert({ ...task, user_id: user.id })
    .select()
    .single();
  if (error) throw error;
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
  return data;
}

export async function deleteTask(id) {
  const supabase = getSupabase();
  const { error } = await supabase.from('tasks').delete().eq('id', id);
  if (error) throw error;
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
  return data;
}

export async function processInboxItem(id) {
  const supabase = getSupabase();
  const { error } = await supabase
    .from('inbox_items')
    .update({ processed: true })
    .eq('id', id);
  if (error) throw error;
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
  return data;
}
