'use client';

import { Check, Clock, MoreHorizontal, Pencil, Repeat, Trash2, User } from 'lucide-react';
import { useState, useRef } from 'react';
import { format } from 'date-fns';

const quadrantColors = { 1: 'var(--q1)', 2: 'var(--q2)', 3: 'var(--q3)', 4: 'var(--q4)' };
const quadrantBg = { 1: 'var(--q1-bg)', 2: 'var(--q2-bg)', 3: 'var(--q3-bg)', 4: 'var(--q4-bg)' };
const quadrantLabels = { 1: 'Q1', 2: 'Q2', 3: 'Q3', 4: 'Q4' };

function haptic() {
  if (navigator.vibrate) navigator.vibrate(10);
}

export default function TaskCard({ task, roles = [], contexts = [], onToggle, onEdit, onDelete }) {
  const [showMenu, setShowMenu] = useState(false);
  const [swipeX, setSwipeX] = useState(0);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const isSwiping = useRef(false);

  const isDone = task.status === 'done';
  const role = roles.find(r => r.id === task.role_id);
  const context = contexts.find(c => c.id === task.context_id);
  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && !isDone;

  // Swipe handlers
  const onTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isSwiping.current = false;
  };

  const onTouchMove = (e) => {
    const dx = e.touches[0].clientX - touchStartX.current;
    const dy = e.touches[0].clientY - touchStartY.current;
    // Only swipe if horizontal movement > vertical
    if (!isSwiping.current && Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      isSwiping.current = true;
    }
    if (isSwiping.current) {
      e.preventDefault();
      setSwipeX(dx);
    }
  };

  const onTouchEnd = () => {
    if (swipeX > 80) {
      haptic();
      onToggle(task);
    } else if (swipeX < -80) {
      onEdit(task);
    }
    setSwipeX(0);
    isSwiping.current = false;
  };

  return (
    <div className="relative overflow-hidden rounded-xl slide-in">
      {/* Swipe reveal backgrounds */}
      {swipeX > 20 && (
        <div className="absolute inset-y-0 left-0 w-20 flex items-center justify-center rounded-l-xl" style={{ background: 'var(--success-bg)' }}>
          <Check size={20} style={{ color: 'var(--success)' }} />
        </div>
      )}
      {swipeX < -20 && (
        <div className="absolute inset-y-0 right-0 w-20 flex items-center justify-center rounded-r-xl" style={{ background: 'var(--accent-bg)' }}>
          <Pencil size={20} style={{ color: 'var(--accent)' }} />
        </div>
      )}

      {/* Card content */}
      <div
        className={`card flex items-start gap-3 ${isDone ? 'opacity-50' : ''}`}
        style={{
          borderLeft: `3px solid ${quadrantColors[task.quadrant] || 'var(--border)'}`,
          transform: `translateX(${swipeX}px)`,
          transition: swipeX === 0 ? 'transform 0.2s ease-out' : 'none',
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Checkbox */}
        <div
          className={`checkbox mt-0.5 ${isDone ? 'checked' : ''}`}
          onClick={() => { haptic(); onToggle(task); }}
        >
          {isDone && <Check size={13} color="white" strokeWidth={3} />}
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
            {task.recurrence_rule && (
              <span className="badge flex items-center gap-1" style={{ background: 'var(--accent-bg)', color: 'var(--accent)' }}>
                <Repeat size={10} />
                {task.recurrence_interval > 1
                  ? `Every ${task.recurrence_interval} ${task.recurrence_rule.replace('ly', '') + 's'}`
                  : task.recurrence_rule === 'daily' ? 'Daily'
                  : task.recurrence_rule === 'weekly' ? 'Weekly'
                  : task.recurrence_rule === 'monthly' ? 'Monthly'
                  : 'Yearly'}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="relative">
          <button
            className="p-2.5 -m-1 rounded-lg"
            style={{ color: 'var(--text-muted)' }}
            onClick={() => setShowMenu(!showMenu)}
          >
            <MoreHorizontal size={18} />
          </button>
          {showMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 top-10 z-20 rounded-lg py-1 min-w-[120px]" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)' }}>
                <button
                  className="w-full px-3 py-3 text-left text-sm flex items-center gap-2 hover:opacity-80"
                  style={{ color: 'var(--text)' }}
                  onClick={() => { onEdit(task); setShowMenu(false); }}
                >
                  <Pencil size={14} /> Edit
                </button>
                <button
                  className="w-full px-3 py-3 text-left text-sm flex items-center gap-2 hover:opacity-80"
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
    </div>
  );
}
