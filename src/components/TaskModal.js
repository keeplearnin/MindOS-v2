'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const QUADRANT_LABELS = {
  1: '🔴 Q1: Urgent + Important',
  2: '🟢 Q2: Important (Big Rocks)',
  3: '🟡 Q3: Urgent, Not Important',
  4: '⚪ Q4: Not Urgent/Important',
};

export default function TaskModal({ open, onClose, onSave, task, roles = [], contexts = [], projects = [] }) {
  const [form, setForm] = useState({
    title: '',
    notes: '',
    status: 'next_action',
    quadrant: 2,
    role_id: '',
    context_id: '',
    project_id: '',
    due_date: '',
    scheduled_date: '',
    is_big_rock: false,
    energy_level: '',
    estimated_minutes: '',
    waiting_for_whom: '',
  });

  useEffect(() => {
    if (task) {
      setForm({
        title: task.title || '',
        notes: task.notes || '',
        status: task.status || 'next_action',
        quadrant: task.quadrant || 2,
        role_id: task.role_id || '',
        context_id: task.context_id || '',
        project_id: task.project_id || '',
        due_date: task.due_date || '',
        scheduled_date: task.scheduled_date || '',
        is_big_rock: task.is_big_rock || false,
        energy_level: task.energy_level || '',
        estimated_minutes: task.estimated_minutes || '',
        waiting_for_whom: task.waiting_for_whom || '',
      });
    } else {
      setForm({
        title: '', notes: '', status: 'next_action', quadrant: 2,
        role_id: '', context_id: '', project_id: '', due_date: '',
        scheduled_date: '', is_big_rock: false, energy_level: '',
        estimated_minutes: '', waiting_for_whom: '',
      });
    }
  }, [task, open]);

  if (!open) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    const data = { ...form };
    // Clean empty strings to null
    ['role_id', 'context_id', 'project_id', 'due_date', 'scheduled_date', 'energy_level'].forEach(k => {
      if (!data[k]) data[k] = null;
    });
    if (!data.estimated_minutes) data.estimated_minutes = null;
    else data.estimated_minutes = parseInt(data.estimated_minutes);
    if (!data.waiting_for_whom) data.waiting_for_whom = null;
    onSave(data);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal animate-in" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{task ? 'Edit Task' : 'New Task'}</h2>
          <button onClick={onClose} className="p-1 rounded" style={{ color: 'var(--text-muted)' }}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            className="input text-base font-medium"
            placeholder="What needs to be done?"
            value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })}
            autoFocus
          />

          <textarea
            className="input"
            placeholder="Notes..."
            rows={2}
            value={form.notes}
            onChange={e => setForm({ ...form, notes: e.target.value })}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Status</label>
              <select className="input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                <option value="next_action">Next Action</option>
                <option value="waiting_for">Waiting For</option>
                <option value="someday_maybe">Someday/Maybe</option>
                <option value="reference">Reference</option>
              </select>
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Quadrant</label>
              <select className="input" value={form.quadrant} onChange={e => setForm({ ...form, quadrant: parseInt(e.target.value) })}>
                {Object.entries(QUADRANT_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Role</label>
              <select className="input" value={form.role_id} onChange={e => setForm({ ...form, role_id: e.target.value })}>
                <option value="">No role</option>
                {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Context</label>
              <select className="input" value={form.context_id} onChange={e => setForm({ ...form, context_id: e.target.value })}>
                <option value="">No context</option>
                {contexts.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Due Date</label>
              <input type="date" className="input" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} />
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Project</label>
              <select className="input" value={form.project_id} onChange={e => setForm({ ...form, project_id: e.target.value })}>
                <option value="">No project</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
            </div>
          </div>

          {form.status === 'waiting_for' && (
            <input
              className="input"
              placeholder="Waiting for whom?"
              value={form.waiting_for_whom}
              onChange={e => setForm({ ...form, waiting_for_whom: e.target.value })}
            />
          )}

          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <input
              type="checkbox"
              checked={form.is_big_rock}
              onChange={e => setForm({ ...form, is_big_rock: e.target.checked })}
              className="w-4 h-4 rounded"
            />
            <span>🪨 Big Rock (weekly priority)</span>
          </label>

          <div className="flex gap-2 pt-2">
            <button type="submit" className="btn btn-primary flex-1">
              {task ? 'Update' : 'Create Task'}
            </button>
            <button type="button" onClick={onClose} className="btn btn-ghost">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
