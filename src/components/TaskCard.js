'use client';

import { Check, Clock, MoreHorizontal, Pencil, Trash2, User } from 'lucide-react';
import { useState } from 'react';
import { format } from 'date-fns';

const quadrantColors = { 1: 'var(--q1)', 2: 'var(--q2)', 3: 'var(--q3)', 4: 'var(--q4)' };
const quadrantBg = { 1: 'var(--q1-bg)', 2: 'var(--q2-bg)', 3: 'var(--q3-bg)', 4: 'var(--q4-bg)' };
const quadrantLabels = { 1: 'Q1', 2: 'Q2', 3: 'Q3', 4: 'Q4' };

export default function TaskCard({ task, roles = [], contexts = [], onToggle, onEdit, onDelete }) {
  const [showMenu, setShowMenu] = useState(false);
  const isDone = task.status === 'done';
  const role = roles.find(r => r.id === task.role_id);
  const context = contexts.find(c => c.id === task.context_id);
  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && !isDone;

  return (
    <div
      className={`card slide-in flex items-start gap-3 ${isDone ? 'opacity-50' : ''}`}
      style={{ borderLeft: `3px solid ${quadrantColors[task.quadrant] || 'var(--border)'}` }}
    >
      {/* Checkbox */}
      <div
        className={`checkbox mt-0.5 ${isDone ? 'checked' : ''}`}
        onClick={() => onToggle(task)}
      >
        {isDone && <Check size={12} color="white" strokeWidth={3} />}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${isDone ? 'line-through' : ''}`} style={{ color: isDone ? 'var(--text-muted)' : 'var(--text)' }}>
          {task.is_big_rock && '🪨 '}{task.title}
        </p>

        {task.notes && (
          <p className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--text-muted)' }}>{task.notes}</p>
        )}

        <div className="flex flex-wrap items-center gap-2 mt-2">
          {task.quadrant && (
            <span className="badge" style={{ background: quadrantBg[task.quadrant], color: quadrantColors[task.quadrant] }}>
              {quadrantLabels[task.quadrant]}
            </span>
          )}
          {role && (
            <span className="badge" style={{ background: `${role.color}15`, color: role.color }}>
              {role.name}
            </span>
          )}
          {context && (
            <span className="badge" style={{ background: 'var(--bg)', color: 'var(--text-secondary)' }}>
              {context.icon} {context.name}
            </span>
          )}
          {task.due_date && (
            <span className="badge flex items-center gap-1" style={{ background: isOverdue ? 'var(--danger-bg)' : 'var(--bg)', color: isOverdue ? 'var(--danger)' : 'var(--text-muted)' }}>
              <Clock size={10} />
              {format(new Date(task.due_date), 'MMM d')}
            </span>
          )}
          {task.waiting_for_whom && (
            <span className="badge flex items-center gap-1" style={{ background: 'var(--warning-bg)', color: 'var(--warning)' }}>
              <User size={10} /> {task.waiting_for_whom}
            </span>
          )}
          {task.email_subject && (
            <span className="badge" style={{ background: 'var(--accent-bg)', color: 'var(--accent)' }}>
              📧 Email
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="relative">
        <button
          className="p-1 rounded"
          style={{ color: 'var(--text-muted)' }}
          onClick={() => setShowMenu(!showMenu)}
        >
          <MoreHorizontal size={16} />
        </button>
        {showMenu && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
            <div className="absolute right-0 top-8 z-20 rounded-lg py-1 min-w-[120px]" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)' }}>
              <button
                className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:opacity-80"
                style={{ color: 'var(--text)' }}
                onClick={() => { onEdit(task); setShowMenu(false); }}
              >
                <Pencil size={14} /> Edit
              </button>
              <button
                className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:opacity-80"
                style={{ color: 'var(--danger)' }}
                onClick={() => { onDelete(task.id); setShowMenu(false); }}
              >
                <Trash2 size={14} /> Delete
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
