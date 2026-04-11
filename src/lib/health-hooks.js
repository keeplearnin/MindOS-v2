'use client';

import useSWR, { mutate as globalMutate } from 'swr';
import { getSupabase } from './supabase-browser';

// ─── Cache Invalidation ───────────────────────────────────────
function invalidate(prefix) {
  globalMutate(
    (key) => Array.isArray(key) && key[0] === prefix,
    undefined,
    { revalidate: true }
  );
}

// ─── Read Hooks (direct Supabase via SWR) ─────────────────────

export function useKnowledgeSources() {
  const key = ['knowledge_sources_list'];
  const { data, error, isLoading, mutate } = useSWR(key, async () => {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('knowledge_sources')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }, { dedupingInterval: 5000 });

  return { data: data || [], loading: isLoading, error, refetch: () => mutate() };
}

export function useKnowledgeVideos(sourceId) {
  const key = sourceId ? ['knowledge_videos_list', sourceId] : null;
  const { data, error, isLoading, mutate } = useSWR(key, async () => {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('knowledge_videos')
      .select('*')
      .eq('source_id', sourceId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }, { dedupingInterval: 5000 });

  return { data: data || [], loading: isLoading, error, refetch: () => mutate() };
}

export function useVideoStats(sourceId) {
  const key = sourceId ? ['knowledge_video_stats', sourceId] : null;
  const { data, error, isLoading } = useSWR(key, async () => {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('knowledge_videos')
      .select('transcript_status')
      .eq('source_id', sourceId);
    if (error) throw error;
    const stats = { total: 0, pending: 0, ready: 0, loading: 0, error: 0, no_transcript: 0 };
    for (const v of (data || [])) {
      stats.total++;
      stats[v.transcript_status] = (stats[v.transcript_status] || 0) + 1;
    }
    return stats;
  }, { dedupingInterval: 3000 });

  return { data: data || { total: 0, pending: 0, ready: 0, loading: 0, error: 0, no_transcript: 0 }, loading: isLoading, error };
}

export function useHealthQueries(limit = 50) {
  const key = ['health_queries_list', limit];
  const { data, error, isLoading, mutate } = useSWR(key, async () => {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('health_queries')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data || [];
  }, { dedupingInterval: 5000 });

  return { data: data || [], loading: isLoading, error, refetch: () => mutate() };
}

export function useHealthProtocols(status = null) {
  const key = ['health_protocols_list', status];
  const { data, error, isLoading, mutate } = useSWR(key, async () => {
    const supabase = getSupabase();
    let query = supabase
      .from('health_protocols')
      .select('*')
      .order('created_at', { ascending: false });
    if (status) query = query.eq('status', status);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }, { dedupingInterval: 5000 });

  return { data: data || [], loading: isLoading, error, refetch: () => mutate() };
}

// ─── Mutations (call API routes, then invalidate SWR) ─────────

export async function loadChannel(url) {
  const res = await fetch('/api/health/load-channel', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to load channel');
  invalidate('knowledge_sources_list');
  invalidate('knowledge_videos_list');
  return data;
}

export async function loadTranscripts(sourceId, batchSize = 5) {
  const res = await fetch('/api/health/load-transcripts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sourceId, batchSize }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to process transcripts');
  invalidate('knowledge_videos_list');
  invalidate('knowledge_video_stats');
  return data;
}

export async function askHealthQuestion(question, maxChunks = 8) {
  const res = await fetch('/api/health/ask', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, maxChunks }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to process question');
  invalidate('health_queries_list');
  return data;
}

export async function createProtocol(queryId) {
  const res = await fetch('/api/health/create-protocol', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ queryId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to create protocol');
  invalidate('health_protocols_list');
  return data;
}

export async function updateProtocol(id, updates) {
  const res = await fetch('/api/health/update-protocol', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, updates }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update protocol');
  invalidate('health_protocols_list');
  return data.protocol;
}
