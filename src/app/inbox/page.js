'use client';

import AppShell from '@/components/AppShell';
import { useInbox, useRoles, useContexts, useProjects, processInboxItem, createTask, createInboxItem } from '@/lib/hooks';
import { useState } from 'react';
import { Inbox, ArrowRight, Trash2, Plus, Archive, Clock, Lightbulb } from 'lucide-react';
import VoiceMic from '@/components/VoiceMic';

const QUADRANT_OPTIONS = [
  { value: 1, label: '🔴 Q1: Urgent + Important', color: 'var(--q1)' },
  { value: 2, label: '🟢 Q2: Important (Do This!)', color: 'var(--q2)' },
  { value: 3, label: '🟡 Q3: Urgent, Not Important', color: 'var(--q3)' },
  { value: 4, label: '⚪ Q4: Not Urgent/Important', color: 'var(--q4)' },
];

function ProcessingCard({ item, roles, contexts, projects, onProcess }) {
  const [action, setAction] = useState(null); // 'task', 'someday', 'reference', 'trash'
  const [form, setForm] = useState({
    title: item.title,
    status: 'next_action',
    quadrant: 2,
    role_id: '',
    context_id: '',
    project_id: '',
    due_date: '',
    waiting_for_whom: '',
  });

  const handleProcess = async (processAction) => {
    if (processAction === 'trash') {
      await processInboxItem(item.id);
      onProcess();
      return;
    }

    if (processAction === 'reference' || processAction === 'someday') {
      await createTask({
        title: form.title || item.title,
        status: processAction === 'someday' ? 'someday_maybe' : 'reference',
        email_id: item.email_id,
        email_subject: item.email_subject,
        email_from: item.email_from,
      });
      await processInboxItem(item.id);
      onProcess();
      return;
    }

    // Create as task
    const taskData = {
      title: form.title || item.title,
      status: form.status,
      quadrant: form.quadrant,
      role_id: form.role_id || null,
      context_id: form.context_id || null,
      project_id: form.project_id || null,
      due_date: form.due_date || null,
      waiting_for_whom: form.waiting_for_whom || null,
      email_id: item.email_id,
      email_subject: item.email_subject,
      email_from: item.email_from,
    };
    await createTask(taskData);
    await processInboxItem(item.id);
    onProcess();
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

      {/* GTD Clarify: Is it actionable? */}
      {!action && (
        <div>
          <p className="text-xs mb-3 font-medium" style={{ color: 'var(--text-muted)' }}>GTD: Is this actionable?</p>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setAction('task')} className="btn btn-primary flex-1 min-w-[calc(50%-0.25rem)]">
              <ArrowRight size={14} /> Yes → Task
            </button>
            <button onClick={() => handleProcess('someday')} className="btn btn-ghost min-w-[calc(50%-0.25rem)]">
              <Lightbulb size={14} /> Someday
            </button>
            <button onClick={() => handleProcess('reference')} className="btn btn-ghost min-w-[calc(50%-0.25rem)]">
              <Archive size={14} /> Reference
            </button>
            <button onClick={() => handleProcess('trash')} className="btn btn-danger min-w-[calc(50%-0.25rem)]">
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Task creation form */}
      {action === 'task' && (
        <div className="space-y-3 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2">
            <input
              className="input flex-1"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              placeholder="Task title"
            />
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

function InboxPage() {
  const { data: items, refetch } = useInbox();
  const { data: roles } = useRoles();
  const { data: contexts } = useContexts();
  const { data: projects } = useProjects();
  const [newItem, setNewItem] = useState('');

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newItem.trim()) return;
    await createInboxItem({ title: newItem.trim(), source: 'manual' });
    setNewItem('');
    refetch();
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
            GTD: Capture everything, then clarify one at a time
          </p>
        </div>
        <span className="badge text-sm px-3 py-1" style={{ background: 'var(--accent)15', color: 'var(--accent)' }}>
          {items.length} items
        </span>
      </div>

      {/* Quick capture */}
      <form onSubmit={handleAdd} className="flex gap-2 mb-6 items-center">
        <input
          className="input flex-1"
          placeholder="Capture something... (thought, task, idea)"
          value={newItem}
          onChange={e => setNewItem(e.target.value)}
        />
        <VoiceMic onResult={(t) => setNewItem(t)} size={16} />
        <button type="submit" className="btn btn-primary">
          <Plus size={16} /> Capture
        </button>
      </form>

      {items.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="text-xl font-semibold mb-2">Inbox Zero!</h2>
          <p style={{ color: 'var(--text-muted)' }}>Your mind is clear. Go work on your Big Rocks.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(item => (
            <ProcessingCard
              key={item.id}
              item={item}
              roles={roles}
              contexts={contexts}
              projects={projects}
              onProcess={refetch}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Page() {
  return <AppShell><InboxPage /></AppShell>;
}
