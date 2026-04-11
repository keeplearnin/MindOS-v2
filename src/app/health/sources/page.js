'use client';

import AppShell from '@/components/AppShell';
import HealthNav from '@/components/HealthNav';
import { useKnowledgeSources, useKnowledgeVideos, useKnowledgeArticles, useVideoStats, loadSource, loadTranscripts } from '@/lib/health-hooks';
import { Dna, Plus, Loader2, CheckCircle2, AlertCircle, Clock, Youtube, Globe, FileText, ChevronDown, ChevronUp, Play, ExternalLink } from 'lucide-react';
import { useState, useCallback, useRef, useEffect } from 'react';

const STATUS_COLORS = {
  ready: 'var(--q2)',
  pending: 'var(--warning)',
  loading: 'var(--accent)',
  error: 'var(--danger)',
  no_transcript: 'var(--text-muted)',
  no_content: 'var(--text-muted)',
};

const STATUS_ICONS = {
  ready: CheckCircle2,
  pending: Clock,
  loading: Loader2,
  error: AlertCircle,
  no_transcript: AlertCircle,
  no_content: AlertCircle,
};

function SourcesContent() {
  const { data: sources, loading: sourcesLoading } = useKnowledgeSources();
  const [sourceUrl, setSourceUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingType, setLoadingType] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [expandedSource, setExpandedSource] = useState(null);

  const detectType = (url) => {
    if (!url) return null;
    try {
      const hostname = new URL(url).hostname.replace('www.', '');
      if (hostname === 'youtube.com' || hostname === 'm.youtube.com') {
        if (url.includes('/watch') || url.includes('/shorts/') || url.includes('/embed/') || url.includes('/live/')) return 'video';
        return 'channel';
      }
      if (hostname === 'youtu.be') return 'video';
      return 'article';
    } catch { return 'article'; }
  };

  const handleLoad = async () => {
    if (!sourceUrl.trim()) return;
    setIsLoading(true);
    setLoadError(null);
    setLoadingType(detectType(sourceUrl.trim()));
    try {
      await loadSource(sourceUrl.trim());
      setSourceUrl('');
    } catch (err) {
      setLoadError(err.message);
    } finally {
      setIsLoading(false);
      setLoadingType(null);
    }
  };

  const detectedType = detectType(sourceUrl);
  const typeLabels = { video: 'YouTube Video', channel: 'YouTube Channel', article: 'Article' };
  const loadingLabels = { video: 'Loading video...', channel: 'Loading channel...', article: 'Scraping article...' };

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

      {/* Add Source */}
      <div className="card mb-6">
        <h2 className="text-base font-semibold mb-3" style={{ color: 'var(--text)' }}>Add Source</h2>
        <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
          Paste any URL — YouTube channel, video, or article. Content will be indexed for AI-powered Q&A.
        </p>
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              className="input w-full"
              placeholder="Paste a YouTube URL or article link..."
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLoad()}
              disabled={isLoading}
              style={{ paddingRight: detectedType && sourceUrl ? '120px' : undefined }}
            />
            {detectedType && sourceUrl && !isLoading && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs px-2 py-0.5 rounded-full flex items-center gap-1"
                style={{ background: 'var(--bg)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                {detectedType === 'article' ? <Globe size={10} /> : <Youtube size={10} />}
                {typeLabels[detectedType]}
              </span>
            )}
          </div>
          <button
            className="btn btn-primary flex items-center gap-2"
            onClick={handleLoad}
            disabled={isLoading || !sourceUrl.trim()}
          >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
            {isLoading ? (loadingLabels[loadingType] || 'Loading...') : 'Add'}
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
          <Dna size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 12px' }} />
          <p className="text-base font-medium mb-1" style={{ color: 'var(--text)' }}>No sources yet</p>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Add a YouTube channel, video, or article above to get started.
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

// ─── Source Card (handles all types) ──────────────────────────
function SourceCard({ source, expanded, onToggle }) {
  if (source.type === 'article') {
    return <ArticleSourceCard source={source} expanded={expanded} onToggle={onToggle} />;
  }
  return <VideoSourceCard source={source} expanded={expanded} onToggle={onToggle} />;
}

// ─── YouTube Channel/Video Card ──────────────────────────────
function VideoSourceCard({ source, expanded, onToggle }) {
  const { data: videos, loading: videosLoading } = useKnowledgeVideos(expanded ? source.id : null);
  const { data: stats } = useVideoStats(source.id);
  const [indexing, setIndexing] = useState(false);
  const [indexProgress, setIndexProgress] = useState(null);
  const indexingRef = useRef(false);
  const abortRef = useRef(null);

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
  const isChannel = source.type === 'youtube_channel';

  return (
    <div className="card">
      <div className="flex items-center gap-3 cursor-pointer" onClick={onToggle}>
        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: 'rgba(239, 68, 68, 0.1)' }}>
          <Youtube size={18} style={{ color: '#ef4444' }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-sm truncate" style={{ color: 'var(--text)' }}>{source.title}</p>
            <span className="text-xs px-1.5 py-0.5 rounded shrink-0"
              style={{ background: 'var(--bg)', color: 'var(--text-muted)', fontSize: '0.65rem' }}>
              {isChannel ? 'Channel' : 'Video'}
            </span>
          </div>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {isChannel
              ? `${source.video_count} videos \u00b7 ${stats.ready} indexed \u00b7 ${readyPct}% ready`
              : `${stats.ready > 0 ? 'Indexed' : stats.pending > 0 ? 'Pending' : source.status === 'error' ? 'Error' : source.status}`
            }
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isChannel && stats.pending > 0 && !indexing && (
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
          {source.status === 'loading' && !indexing && (
            <Loader2 size={14} className="animate-spin" style={{ color: 'var(--accent)' }} />
          )}
          {expanded ? <ChevronUp size={16} style={{ color: 'var(--text-muted)' }} /> : <ChevronDown size={16} style={{ color: 'var(--text-muted)' }} />}
        </div>
      </div>

      {/* Progress bar for channels */}
      {isChannel && stats.total > 0 && (
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

// ─── Article Card ─────────────────────────────────────────────
function ArticleSourceCard({ source, expanded, onToggle }) {
  const { data: articles, loading: articlesLoading } = useKnowledgeArticles(expanded ? source.id : null);
  const article = articles[0]; // Articles are 1:1 with source

  const statusLabel = source.status === 'ready' ? 'Indexed' : source.status === 'error' ? 'Error' : source.status;

  return (
    <div className="card">
      <div className="flex items-center gap-3 cursor-pointer" onClick={onToggle}>
        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: 'rgba(99, 102, 241, 0.1)' }}>
          <FileText size={18} style={{ color: 'var(--accent)' }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-sm truncate" style={{ color: 'var(--text)' }}>{source.title}</p>
            <span className="text-xs px-1.5 py-0.5 rounded shrink-0"
              style={{ background: 'var(--bg)', color: 'var(--text-muted)', fontSize: '0.65rem' }}>
              Article
            </span>
          </div>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {source.metadata?.site_name || new URL(source.url).hostname.replace('www.', '')}
            {source.metadata?.author ? ` \u00b7 ${source.metadata.author}` : ''}
            {' \u00b7 '}{statusLabel}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {source.status === 'loading' && (
            <Loader2 size={14} className="animate-spin" style={{ color: 'var(--accent)' }} />
          )}
          {source.status === 'ready' && (
            <CheckCircle2 size={14} style={{ color: 'var(--q2)' }} />
          )}
          {source.status === 'error' && (
            <AlertCircle size={14} style={{ color: 'var(--danger)' }} />
          )}
          {expanded ? <ChevronUp size={16} style={{ color: 'var(--text-muted)' }} /> : <ChevronDown size={16} style={{ color: 'var(--text-muted)' }} />}
        </div>
      </div>

      {/* Expanded article details */}
      {expanded && (
        <div className="mt-4 border-t pt-3" style={{ borderColor: 'var(--border)' }}>
          {articlesLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 size={18} className="animate-spin" style={{ color: 'var(--accent)' }} />
            </div>
          ) : article ? (
            <div className="space-y-2">
              {article.excerpt && (
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>{article.excerpt}</p>
              )}
              <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--text-muted)' }}>
                {article.word_count > 0 && <span>{article.word_count.toLocaleString()} words</span>}
                {article.chunk_count > 0 && <span>{article.chunk_count} chunks</span>}
                <a href={source.url} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}
                  className="flex items-center gap-1 hover:opacity-80" style={{ color: 'var(--accent)' }}>
                  <ExternalLink size={11} /> Open
                </a>
              </div>
            </div>
          ) : (
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No details available</p>
          )}
        </div>
      )}
    </div>
  );
}

export default function Page() {
  return <AppShell><SourcesContent /></AppShell>;
}
