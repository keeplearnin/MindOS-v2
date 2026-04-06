'use client';

import AppShell from '@/components/AppShell';
import HealthNav from '@/components/HealthNav';
import { useHealthQueries, askHealthQuestion, createProtocol } from '@/lib/health-hooks';
import { MessageSquare, Send, Loader2, ExternalLink, FlaskConical, ChevronDown, ChevronUp, Clock, AlertTriangle } from 'lucide-react';
import { useState } from 'react';

function AskContent() {
  const { data: queries, loading: queriesLoading } = useHealthQueries(30);
  const [question, setQuestion] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [currentAnswer, setCurrentAnswer] = useState(null);
  const [error, setError] = useState(null);
  const [creatingProtocol, setCreatingProtocol] = useState(null);
  const [expandedHistory, setExpandedHistory] = useState({});

  const handleAsk = async () => {
    if (!question.trim() || isAsking) return;
    setIsAsking(true);
    setError(null);
    setCurrentAnswer(null);
    try {
      const result = await askHealthQuestion(question.trim());
      setCurrentAnswer(result);
      setQuestion('');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsAsking(false);
    }
  };

  const handleCreateProtocol = async (queryId) => {
    setCreatingProtocol(queryId);
    try {
      await createProtocol(queryId);
    } catch (err) {
      console.error('Protocol creation error:', err);
    } finally {
      setCreatingProtocol(null);
    }
  };

  return (
    <div className="max-w-4xl animate-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--accent)', opacity: 0.9 }}>
          <MessageSquare size={22} color="white" />
        </div>
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>Ask Your Sources</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>AI-powered Q&A with citations from indexed expert content</p>
        </div>
      </div>

      <HealthNav />

      {/* Question Input */}
      <div className="card mb-6">
        <textarea
          className="input w-full mb-3"
          rows={3}
          placeholder="What does Huberman recommend for improving deep sleep quality?"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleAsk();
          }}
          disabled={isAsking}
          style={{ resize: 'vertical', minHeight: 80 }}
        />
        <div className="flex items-center justify-between">
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Press Cmd+Enter to ask
          </p>
          <button
            className="btn btn-primary flex items-center gap-2"
            onClick={handleAsk}
            disabled={isAsking || !question.trim()}
          >
            {isAsking ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            {isAsking ? 'Thinking...' : 'Ask'}
          </button>
        </div>
      </div>

      {error && (
        <div className="card mb-4 flex items-start gap-3" style={{ borderColor: 'var(--danger)' }}>
          <AlertTriangle size={18} style={{ color: 'var(--danger)', flexShrink: 0, marginTop: 2 }} />
          <p className="text-sm" style={{ color: 'var(--danger)' }}>{error}</p>
        </div>
      )}

      {/* Current Answer */}
      {currentAnswer && (
        <AnswerCard
          answer={currentAnswer.answer}
          citations={currentAnswer.citations}
          queryId={currentAnswer.queryId}
          onCreateProtocol={handleCreateProtocol}
          creatingProtocol={creatingProtocol}
          isNew
        />
      )}

      {/* Query History */}
      {queries.length > 0 && (
        <div className="mt-8">
          <h2 className="text-base font-semibold mb-3" style={{ color: 'var(--text)' }}>Previous Questions</h2>
          <div className="space-y-3">
            {queries.map(q => (
              <div key={q.id} className="card">
                <div
                  className="flex items-center gap-2 cursor-pointer"
                  onClick={() => setExpandedHistory(prev => ({ ...prev, [q.id]: !prev[q.id] }))}
                >
                  <Clock size={14} style={{ color: 'var(--text-muted)' }} />
                  <p className="flex-1 text-sm font-medium truncate" style={{ color: 'var(--text)' }}>
                    {q.question}
                  </p>
                  <span className="text-xs shrink-0" style={{ color: 'var(--text-muted)' }}>
                    {new Date(q.created_at).toLocaleDateString()}
                  </span>
                  {expandedHistory[q.id]
                    ? <ChevronUp size={14} style={{ color: 'var(--text-muted)' }} />
                    : <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />
                  }
                </div>
                {expandedHistory[q.id] && (
                  <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
                    <AnswerCard
                      answer={q.answer}
                      citations={q.citations || []}
                      queryId={q.id}
                      onCreateProtocol={handleCreateProtocol}
                      creatingProtocol={creatingProtocol}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {!currentAnswer && queries.length === 0 && !queriesLoading && (
        <div className="card text-center py-12">
          <MessageSquare size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 12px' }} />
          <p className="text-base font-medium mb-1" style={{ color: 'var(--text)' }}>Ask your first question</p>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Make sure you've loaded and indexed at least one source first.
          </p>
        </div>
      )}
    </div>
  );
}

function AnswerCard({ answer, citations, queryId, onCreateProtocol, creatingProtocol, isNew }) {
  return (
    <div className={isNew ? 'card mb-4' : ''} style={isNew ? { borderColor: 'var(--accent)', borderWidth: 1 } : {}}>
      {/* Answer text */}
      <div className="text-sm leading-relaxed mb-4" style={{ color: 'var(--text)', whiteSpace: 'pre-wrap' }}>
        {answer}
      </div>

      {/* Disclaimer */}
      <p className="text-xs mb-4 px-3 py-2 rounded-lg" style={{
        color: 'var(--warning)',
        background: 'rgba(245, 158, 11, 0.08)',
      }}>
        Based on expert content, not medical advice. Always consult a healthcare provider.
      </p>

      {/* Citations */}
      {citations.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>SOURCES</p>
          <div className="space-y-1.5">
            {citations.map((c, i) => (
              <div key={i} className="flex items-start gap-2 text-xs py-1.5 px-2 rounded-lg" style={{ background: 'var(--bg)' }}>
                <span className="font-mono font-bold shrink-0" style={{ color: 'var(--accent)' }}>[{c.index}]</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate" style={{ color: 'var(--text)' }}>{c.video_title}</p>
                  <p className="truncate" style={{ color: 'var(--text-muted)' }}>{c.chunk_content}</p>
                </div>
                {c.timestamp_url && (
                  <a href={c.timestamp_url} target="_blank" rel="noreferrer"
                    className="shrink-0 flex items-center gap-1 hover:opacity-80"
                    style={{ color: 'var(--accent)' }}>
                    <ExternalLink size={12} />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Protocol button */}
      {queryId && (
        <button
          className="btn btn-ghost flex items-center gap-2 text-xs"
          onClick={() => onCreateProtocol(queryId)}
          disabled={creatingProtocol === queryId}
          style={{ color: 'var(--accent)' }}
        >
          {creatingProtocol === queryId
            ? <Loader2 size={14} className="animate-spin" />
            : <FlaskConical size={14} />
          }
          {creatingProtocol === queryId ? 'Creating Protocol...' : 'Create Protocol from This'}
        </button>
      )}
    </div>
  );
}

export default function Page() {
  return <AppShell><AskContent /></AppShell>;
}
