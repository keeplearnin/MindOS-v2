'use client';

import AppShell from '@/components/AppShell';
import { useAuth } from '@/lib/auth-context';
import { createInboxItem, useInbox } from '@/lib/hooks';
import { fetchEmails } from '@/lib/gmail';
import { useState, useEffect } from 'react';
import { Mail, RefreshCw, ArrowRight, Search, Check } from 'lucide-react';
import { format } from 'date-fns';

function EmailPage() {
  const { session, getGoogleToken } = useAuth();
  const { refetch: refetchInbox } = useInbox();
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('is:unread');
  const [converted, setConverted] = useState(new Set());

  const token = getGoogleToken();

  const loadEmails = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchEmails(token, query);
      setEmails(data);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (token) loadEmails();
  }, [token]);

  const convertToInbox = async (email) => {
    await createInboxItem({
      title: email.subject,
      source: 'email',
      email_id: email.id,
      email_subject: email.subject,
      email_from: email.from,
      email_snippet: email.snippet,
    });
    setConverted(prev => new Set([...prev, email.id]));
    refetchInbox();
  };

  if (!token) {
    return (
      <div className="max-w-3xl animate-in">
        <h1 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Mail size={24} style={{ color: 'var(--accent)' }} />
          Email → Todo
        </h1>
        <div className="card text-center py-12">
          <div className="text-4xl mb-4">🔒</div>
          <p className="text-lg font-medium mb-2">Gmail Access Required</p>
          <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
            Sign out and sign back in to grant Gmail access. Make sure to approve the Gmail scope.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl animate-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Mail size={24} style={{ color: 'var(--accent)' }} />
            Email → Todo
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Convert emails to inbox items, then process them with GTD
          </p>
        </div>
        <button onClick={loadEmails} className="btn btn-ghost" disabled={loading}>
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Search */}
      <div className="flex gap-2 mb-6">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input
            className="input pl-9"
            placeholder="Gmail search query (e.g., is:unread, from:boss@company.com)"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && loadEmails()}
          />
        </div>
        <button onClick={loadEmails} className="btn btn-primary">Search</button>
      </div>

      {/* Quick filters */}
      <div className="flex gap-2 mb-4">
        {['is:unread', 'is:starred', 'is:important', 'label:inbox newer_than:1d'].map(q => (
          <button
            key={q}
            className={`tab ${query === q ? 'active' : ''}`}
            onClick={() => { setQuery(q); }}
          >
            {q.replace('newer_than:1d', '(today)').replace('label:', '')}
          </button>
        ))}
      </div>

      {error && (
        <div className="card mb-4" style={{ borderColor: 'var(--danger)' }}>
          <p className="text-sm" style={{ color: 'var(--danger)' }}>{error}</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            You may need to sign out and sign back in to refresh your Google token.
          </p>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
          <RefreshCw size={24} className="animate-spin mx-auto mb-2" />
          Loading emails...
        </div>
      ) : emails.length === 0 ? (
        <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
          <p className="text-lg">No emails found</p>
          <p className="text-sm mt-1">Try a different search query</p>
        </div>
      ) : (
        <div className="space-y-2">
          {emails.map(email => {
            const isConverted = converted.has(email.id);
            return (
              <div key={email.id} className="card flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{email.subject}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{email.from}</p>
                  <p className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--text-muted)' }}>{email.snippet}</p>
                  {email.date && (
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                      {(() => { try { return format(new Date(email.date), 'MMM d, h:mm a'); } catch { return email.date; } })()}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => convertToInbox(email)}
                  className={`btn ${isConverted ? 'btn-ghost' : 'btn-primary'}`}
                  disabled={isConverted}
                >
                  {isConverted ? <><Check size={14} /> Added</> : <><ArrowRight size={14} /> To Inbox</>}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function Page() {
  return <AppShell><EmailPage /></AppShell>;
}
