'use client';

import AppShell from '@/components/AppShell';
import { useAuth } from '@/lib/auth-context';
import { useInbox, useRoles, useContexts, useProjects, processInboxItem, createTask, createInboxItem } from '@/lib/hooks';
import { fetchEmails } from '@/lib/gmail';
import { useState, useEffect } from 'react';
import { Inbox, ArrowRight, Trash2, Plus, Archive, Clock, Lightbulb, Mail, RefreshCw, Search, Check, AlertCircle, Star } from 'lucide-react';
import VoiceMic from '@/components/VoiceMic';
import { format } from 'date-fns';

const QUADRANT_OPTIONS = [
  { value: 1, label: '🔴 Q1: Urgent + Important', color: 'var(--q1)' },
  { value: 2, label: '🟢 Q2: Important (Do This!)', color: 'var(--q2)' },
  { value: 3, label: '🟡 Q3: Urgent, Not Important', color: 'var(--q3)' },
  { value: 4, label: '⚪ Q4: Not Urgent/Important', color: 'var(--q4)' },
];

// ─── Processing Card ───────────────────────────────────────────
function ProcessingCard({ item, roles, contexts, projects, onProcess }) {
  const [action, setAction] = useState(null);
  const [form, setForm] = useState({
    title: item.title, status: 'next_action', quadrant: 2,
    role_id: '', context_id: '', project_id: '', due_date: '', waiting_for_whom: '',
  });

  const handleProcess = async (processAction) => {
    if (processAction === 'trash') { await processInboxItem(item.id); onProcess(); return; }
    if (processAction === 'reference' || processAction === 'someday') {
      await createTask({ title: form.title || item.title, status: processAction === 'someday' ? 'someday_maybe' : 'reference', email_id: item.email_id, email_subject: item.email_subject, email_from: item.email_from });
      await processInboxItem(item.id); onProcess(); return;
    }
    const taskData = { title: form.title || item.title, status: form.status, quadrant: form.quadrant,
      role_id: form.role_id || null, context_id: form.context_id || null, project_id: form.project_id || null,
      due_date: form.due_date || null, waiting_for_whom: form.waiting_for_whom || null,
      email_id: item.email_id, email_subject: item.email_subject, email_from: item.email_from };
    await createTask(taskData); await processInboxItem(item.id); onProcess();
  };

  return (
    <div className="card animate-in">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: item.source === 'email' ? 'var(--accent)15' : 'var(--bg)' }}>
          {item.source === 'email' ? '📧' : '📥'}
        </div>
        <div className="flex-1">
          <p className="font-medium text-sm">{item.title}</p>
          {item.email_from && <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>From: {item.email_from}</p>}
          {item.email_snippet && <p className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--text-muted)' }}>{item.email_snippet}</p>}
          {item.notes && <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{item.notes}</p>}
        </div>
      </div>

      {!action && (
        <div>
          <p className="text-xs mb-3 font-medium" style={{ color: 'var(--text-muted)' }}>GTD: Is this actionable?</p>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setAction('task')} className="btn btn-primary flex-1 min-w-[calc(50%-0.25rem)]"><ArrowRight size={14} /> Yes → Task</button>
            <button onClick={() => handleProcess('someday')} className="btn btn-ghost min-w-[calc(50%-0.25rem)]"><Lightbulb size={14} /> Someday</button>
            <button onClick={() => handleProcess('reference')} className="btn btn-ghost min-w-[calc(50%-0.25rem)]"><Archive size={14} /> Reference</button>
            <button onClick={() => handleProcess('trash')} className="btn btn-danger min-w-[calc(50%-0.25rem)]"><Trash2 size={14} /></button>
          </div>
        </div>
      )}

      {action === 'task' && (
        <div className="space-y-3 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2">
            <input className="input flex-1" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Task title" />
            <VoiceMic onResult={(t) => setForm(f => ({ ...f, title: t }))} size={16} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <select className="input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
              <option value="next_action">Next Action</option>
              <option value="waiting_for">Waiting For</option>
            </select>
            <select className="input" value={form.quadrant} onChange={e => setForm({ ...form, quadrant: parseInt(e.target.value) })}>
              {QUADRANT_OPTIONS.map(q => <option key={q.value} value={q.value}>{q.label}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <select className="input" value={form.role_id} onChange={e => setForm({ ...form, role_id: e.target.value })}>
              <option value="">Role</option>
              {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
            <select className="input" value={form.context_id} onChange={e => setForm({ ...form, context_id: e.target.value })}>
              <option value="">Context</option>
              {contexts.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
            </select>
            <input type="date" className="input" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} />
          </div>
          {form.status === 'waiting_for' && (
            <input className="input" placeholder="Waiting for whom?" value={form.waiting_for_whom} onChange={e => setForm({ ...form, waiting_for_whom: e.target.value })} />
          )}
          <div className="flex gap-2">
            <button onClick={() => handleProcess('task')} className="btn btn-primary flex-1">Create Task</button>
            <button onClick={() => setAction(null)} className="btn btn-ghost">Back</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Email Tab ─────────────────────────────────────────────────
function EmailTab() {
  const { getGoogleToken, refreshGoogleToken, tokenExpired } = useAuth();
  const { refetch: refetchInbox } = useInbox();
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('in:inbox is:important');
  const [converted, setConverted] = useState(new Set());

  const token = getGoogleToken();

  const loadEmails = async () => {
    const t = getGoogleToken();
    if (!t) return;
    setLoading(true); setError(null);
    try { const data = await fetchEmails(t, query); setEmails(data); }
    catch (err) { setError(err.message?.includes('401') ? 'Google token expired. Please reconnect.' : err.message); }
    setLoading(false);
  };

  useEffect(() => { if (token && !tokenExpired) loadEmails(); }, [token, tokenExpired]);

  const convertToInbox = async (email) => {
    try {
      await createInboxItem({ title: email.subject, source: 'email', email_id: email.id, email_subject: email.subject, email_from: email.from, email_snippet: email.snippet });
      setConverted(prev => new Set([...prev, email.id]));
      refetchInbox();
    } catch (err) {
      setError('Failed to convert email to inbox item');
    }
  };

  if (!token || tokenExpired) {
    return (
      <div className="card text-center py-12">
        <div className="text-4xl mb-4">{tokenExpired ? '⏰' : '🔒'}</div>
        <p className="text-lg font-medium mb-2">{tokenExpired ? 'Google Session Expired' : 'Gmail Access Required'}</p>
        <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>{tokenExpired ? 'Reconnect to refresh your token.' : 'Sign in with Google to grant Gmail access.'}</p>
        <button onClick={refreshGoogleToken} className="btn btn-primary"><RefreshCw size={16} /> {tokenExpired ? 'Reconnect' : 'Sign In'}</button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input className="input pl-9" placeholder="Gmail search query..." value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && loadEmails()} />
        </div>
        <button onClick={loadEmails} className="btn btn-primary">Search</button>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {[
          { q: 'in:inbox is:important', label: 'Important + Inbox' },
          { q: 'in:inbox', label: 'Inbox' },
          { q: 'is:important', label: 'Important' },
          { q: 'is:starred', label: 'Starred' },
          { q: 'in:inbox newer_than:1d', label: 'Today' },
        ].map(({ q, label }) => (
          <button key={q} className={`tab ${query === q ? 'active' : ''}`} onClick={() => setQuery(q)}>{label}</button>
        ))}
      </div>

      {error && (
        <div className="card mb-4" style={{ borderColor: 'var(--danger)' }}>
          <p className="text-sm" style={{ color: 'var(--danger)' }}>{error}</p>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}><RefreshCw size={24} className="animate-spin mx-auto mb-2" />Loading emails...</div>
      ) : emails.length === 0 ? (
        <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}><p className="text-lg">No emails found</p><p className="text-sm mt-1">Try a different search query</p></div>
      ) : (
        <div className="space-y-2">
          {emails.map(email => {
            const isConverted = converted.has(email.id);
            return (
              <div key={email.id} className="card flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate flex-1">{email.subject}</p>
                    {email.labelIds?.includes('IMPORTANT') && <span className="badge flex items-center gap-1" style={{ background: 'var(--warning-bg)', color: 'var(--warning)', flexShrink: 0 }}><AlertCircle size={10} /> Important</span>}
                    {email.labelIds?.includes('STARRED') && <Star size={14} fill="#f59e0b" color="#f59e0b" style={{ flexShrink: 0 }} />}
                    {email.labelIds?.includes('UNREAD') && <span className="w-2 h-2 rounded-full" style={{ background: 'var(--accent)', flexShrink: 0 }} />}
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{email.from}</p>
                  <p className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--text-muted)' }}>{email.snippet}</p>
                  {email.date && <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{(() => { try { return format(new Date(email.date), 'MMM d, h:mm a'); } catch { return email.date; } })()}</p>}
                </div>
                <button onClick={() => convertToInbox(email)} className={`btn ${isConverted ? 'btn-ghost' : 'btn-primary'}`} disabled={isConverted}>
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

// ─── Main Inbox Page ───────────────────────────────────────────
function InboxPage() {
  const { data: items, refetch } = useInbox();
  const { data: roles } = useRoles();
  const { data: contexts } = useContexts();
  const { data: projects } = useProjects();
  const [newItem, setNewItem] = useState('');
  const [activeTab, setActiveTab] = useState('inbox');

  const [addError, setAddError] = useState(null);
  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newItem.trim()) return;
    try {
      await createInboxItem({ title: newItem.trim(), source: 'manual' });
      setNewItem('');
      setAddError(null);
    } catch (err) {
      setAddError('Failed to add item');
    }
  };

  return (
    <div className="max-w-3xl animate-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Inbox size={24} style={{ color: 'var(--accent)' }} />
            Inbox
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Capture, clarify, and convert emails to tasks
          </p>
        </div>
        {activeTab === 'inbox' && (
          <span className="badge text-sm px-3 py-1" style={{ background: 'var(--accent)15', color: 'var(--accent)' }}>
            {items.length} items
          </span>
        )}
      </div>

      {/* Tabs: Inbox | Email */}
      <div className="flex gap-1 mb-6 p-1 rounded-lg" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <button className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all`}
          style={{ background: activeTab === 'inbox' ? 'var(--accent)' : 'transparent', color: activeTab === 'inbox' ? 'white' : 'var(--text-muted)' }}
          onClick={() => setActiveTab('inbox')}>
          <Inbox size={16} /> Inbox {items.length > 0 && <span className="text-xs opacity-80">({items.length})</span>}
        </button>
        <button className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all`}
          style={{ background: activeTab === 'email' ? 'var(--accent)' : 'transparent', color: activeTab === 'email' ? 'white' : 'var(--text-muted)' }}
          onClick={() => setActiveTab('email')}>
          <Mail size={16} /> Email
        </button>
      </div>

      {activeTab === 'inbox' && (
        <>
          {/* Quick capture */}
          <form onSubmit={handleAdd} className="flex gap-2 mb-6 items-center">
            <input className="input flex-1" placeholder="Capture something... (thought, task, idea)" value={newItem} onChange={e => setNewItem(e.target.value)} />
            <VoiceMic onResult={(t) => setNewItem(t)} size={16} />
            <button type="submit" className="btn btn-primary"><Plus size={16} /> Capture</button>
          </form>
          {addError && <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>{addError}</p>}

          {items.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-5xl mb-4">🎉</div>
              <h2 className="text-xl font-semibold mb-2">Inbox Zero!</h2>
              <p style={{ color: 'var(--text-muted)' }}>Your mind is clear. Go work on your Big Rocks.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map(item => (
                <ProcessingCard key={item.id} item={item} roles={roles} contexts={contexts} projects={projects} onProcess={refetch} />
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === 'email' && <EmailTab />}
    </div>
  );
}

export default function Page() {
  return <AppShell><InboxPage /></AppShell>;
}
