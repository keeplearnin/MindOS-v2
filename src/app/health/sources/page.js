'use client';

import AppShell from '@/components/AppShell';
import HealthNav from '@/components/HealthNav';
import { useKnowledgeSources, useKnowledgeVideos, useVideoStats, loadChannel, loadTranscripts } from '@/lib/health-hooks';
import { Dna, Plus, Loader2, CheckCircle2, AlertCircle, Clock, Youtube, ChevronDown, ChevronUp, Play } from 'lucide-react';
import { useState, useCallback, useRef, useEffect } from 'react';

const STATUS_COLORS = {
  ready: 'var(--q2)',
  pending: 'var(--warning)',
  loading: 'var(--accent)',
  error: 'var(--danger)',
  no_transcript: 'var(--text-muted)',
};

const STATUS_ICONS = {
  ready: CheckCircle2,
  pending: Clock,
  loading: Loader2,
  error: AlertCircle,
  no_transcript: AlertCircle,
};

function SourcesContent() {
  const { data: sources, loading: sourcesLoading } = useKnowledgeSources();
  const [channelUrl, setChannelUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [expandedSource, setExpandedSource] = useState(null);

  const handleLoadChannel = async () => {
    if (!channelUrl.trim()) return;
    setIsLoading(true);
    setLoadError(null);
    try {
      await loadChannel(channelUrl.trim());
      setChannelUrl('');
    } catch (err) {
      setLoadError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl animate-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--accent)', opacity: 0.9 }}>
          <Dna size={22} color="white" />
        </div>
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>HealthOS</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Expert knowledge to actionable health protocols</p>
        </div>
      </div>

      <HealthNav />

      {/* Add Channel */}
      <div className="card mb-6">
        <h2 className="text-base font-semibold mb-3" style={{ color: 'var(--text)' }}>Load YouTube Channel</h2>
        <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
          Paste a YouTube channel URL to load all their videos. Transcripts will be indexed for AI-powered Q&A.
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            className="input flex-1"
            placeholder="https://www.youtube.com/@hubaborhab"
            value={channelUrl}
            onChange={(e) => setChannelUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLoadChannel()}
            disabled={isLoading}
          />
          <button
            className="btn btn-primary flex items-center gap-2"
            onClick={handleLoadChannel}
            disabled={isLoading || !channelUrl.trim()}
          >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
            {isLoading ? 'Loading...' : 'Load'}
          </button>
        </div>
        {loadError && (
          <p className="text-sm mt-2" style={{ color: 'var(--danger)' }}>{loadError}</p>
        )}
      </div>

      {/* Sources List */}
      {sourcesLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="animate-spin" style={{ color: 'var(--accent)' }} />
        </div>
      ) : sources.length === 0 ? (
        <div className="card text-center py-12">
          <Youtube size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 12px' }} />
          <p className="text-base font-medium mb-1" style={{ color: 'var(--text)' }}>No sources yet</p>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Load a YouTube channel above to get started with expert health content.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sources.map(source => (
            <SourceCard
              key={source.id}
              source={source}
              expanded={expandedSource === source.id}
              onToggle={() => setExpandedSource(expandedSource === source.id ? null : source.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SourceCard({ source, expanded, onToggle }) {
  const { data: videos, loading: videosLoading } = useKnowledgeVideos(expanded ? source.id : null);
  const { data: stats } = useVideoStats(source.id);
  const [indexing, setIndexing] = useState(false);
  const [indexProgress, setIndexProgress] = useState(null);
  const indexingRef = useRef(false);
  const abortRef = useRef(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => { if (abortRef.current) abortRef.current.abort(); };
  }, []);

  const handleIndex = useCallback(async () => {
    if (indexingRef.current) return;
    indexingRef.current = true;
    abortRef.current = new AbortController();
    setIndexing(true);

    try {
      let remaining = stats.pending;
      while (remaining > 0) {
        if (abortRef.current.signal.aborted) break;
        const result = await loadTranscripts(source.id, 5);
        remaining = result.remaining;
        if (abortRef.current.signal.aborted) break;
        setIndexProgress({ processed: stats.total - remaining, total: stats.total, remaining });
      }
      setIndexProgress(null);
    } catch (err) {
      if (!abortRef.current?.signal.aborted) console.error('Indexing error:', err);
    } finally {
      setIndexing(false);
      indexingRef.current = false;
    }
  }, [source.id, stats]);

  const readyPct = stats.total > 0 ? Math.round((stats.ready / stats.total) * 100) : 0;

  return (
    <div className="card">
      <div className="flex items-center gap-3 cursor-pointer" onClick={onToggle}>
        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: 'rgba(239, 68, 68, 0.1)' }}>
          <Youtube size={18} style={{ color: '#ef4444' }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate" style={{ color: 'var(--text)' }}>{source.title}</p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {source.video_count} videos &middot; {stats.ready} indexed &middot; {readyPct}% ready
          </p>
        </div>
        <div className="flex items-center gap-2">
          {stats.pending > 0 && !indexing && (
            <button
              className="btn btn-primary text-xs px-3 py-1.5"
              onClick={(e) => { e.stopPropagation(); handleIndex(); }}
            >
              Index ({stats.pending})
            </button>
          )}
          {indexing && (
            <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--accent)' }}>
              <Loader2 size={14} className="animate-spin" />
              {indexProgress ? `${indexProgress.processed}/${indexProgress.total}` : 'Starting...'}
            </div>
          )}
          {expanded ? <ChevronUp size={16} style={{ color: 'var(--text-muted)' }} /> : <ChevronDown size={16} style={{ color: 'var(--text-muted)' }} />}
        </div>
      </div>

      {/* Progress bar */}
      {stats.total > 0 && (
        <div className="mt-3 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
          <div className="h-full rounded-full transition-all" style={{
            width: `${readyPct}%`,
            background: readyPct === 100 ? 'var(--q2)' : 'var(--accent)',
          }} />
        </div>
      )}

      {/* Expanded video list */}
      {expanded && (
        <div className="mt-4 border-t pt-3" style={{ borderColor: 'var(--border)' }}>
          {videosLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 size={18} className="animate-spin" style={{ color: 'var(--accent)' }} />
            </div>
          ) : (
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {videos.map(video => {
                const StatusIcon = STATUS_ICONS[video.transcript_status] || Clock;
                return (
                  <div key={video.id} className="flex items-center gap-2 py-1.5 px-2 rounded-lg text-xs"
                    style={{ color: 'var(--text-muted)' }}>
                    <StatusIcon size={13} style={{ color: STATUS_COLORS[video.transcript_status], flexShrink: 0 }} />
                    <span className="truncate flex-1" style={{ color: 'var(--text)' }}>{video.title}</span>
                    {video.chunk_count > 0 && (
                      <span className="shrink-0">{video.chunk_count} chunks</span>
                    )}
                    <a href={video.url} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}
                      className="shrink-0 opacity-50 hover:opacity-100">
                      <Play size={12} />
                    </a>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function Page() {
  return <AppShell><SourcesContent /></AppShell>;
}
