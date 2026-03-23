'use client';

import AppShell from '@/components/AppShell';
import TaskModal from '@/components/TaskModal';
import { useTasks, useRoles, useContexts, useProjects, createTask, updateTask, deleteTask } from '@/lib/hooks';
import { useState } from 'react';
import { Plus, Check, Trash2, GripVertical } from 'lucide-react';

const quadrants = [
  { id: 1, title: 'Q1: Do First', subtitle: 'Urgent + Important', color: 'var(--q1)', emoji: '🔥', tip: 'Crises, deadlines, emergencies' },
  { id: 2, title: 'Q2: Schedule', subtitle: 'Important, Not Urgent', color: 'var(--q2)', emoji: '🎯', tip: 'Planning, prevention, relationships — THE KEY TO EFFECTIVENESS' },
  { id: 3, title: 'Q3: Delegate', subtitle: 'Urgent, Not Important', color: 'var(--q3)', emoji: '📤', tip: 'Interruptions, some meetings, some calls' },
  { id: 4, title: 'Q4: Eliminate', subtitle: 'Not Urgent, Not Important', color: 'var(--q4)', emoji: '🗑️', tip: 'Time wasters, busy work, escape activities' },
];

function MatrixPage() {
  const { data: tasks, refetch } = useTasks();
  const { data: roles } = useRoles();
  const { data: contexts } = useContexts();
  const { data: projects } = useProjects();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [defaultQuadrant, setDefaultQuadrant] = useState(2);
  const [activeQ, setActiveQ] = useState(2); // mobile active quadrant

  const activeTasks = tasks.filter(t => t.status !== 'done' && t.status !== 'deleted');

  const handleToggle = async (task) => {
    await updateTask(task.id, { status: 'done', completed_at: new Date().toISOString() });
    refetch();
  };

  const handleSave = async (data) => {
    if (editingTask) {
      await updateTask(editingTask.id, data);
    } else {
      await createTask({ ...data, quadrant: data.quadrant || defaultQuadrant });
    }
    setModalOpen(false);
    setEditingTask(null);
    refetch();
  };

  const handleDelete = async (id) => {
    await deleteTask(id);
    refetch();
  };

  // Drag and drop support
  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData('taskId', taskId);
  };

  const handleDrop = async (e, quadrantId) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) {
      await updateTask(taskId, { quadrant: quadrantId });
      refetch();
    }
  };

  return (
    <div className="animate-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Eisenhower Matrix</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Habit 3: Put First Things First — Spend most time in Q2
          </p>
        </div>
        <button onClick={() => { setEditingTask(null); setDefaultQuadrant(2); setModalOpen(true); }} className="btn btn-primary">
          <Plus size={16} /> New Task
        </button>
      </div>

      {/* Mobile quadrant tabs */}
      <div className="flex gap-1 mb-4 overflow-x-auto md:hidden">
        {quadrants.map(q => {
          const count = activeTasks.filter(t => t.quadrant === q.id).length;
          return (
            <button
              key={q.id}
              onClick={() => setActiveQ(q.id)}
              className="flex-1 min-w-0 py-2.5 px-2 rounded-lg text-xs font-semibold text-center"
              style={{
                background: activeQ === q.id ? `color-mix(in srgb, ${q.color} 12%, white)` : 'var(--bg-card)',
                color: activeQ === q.id ? q.color : 'var(--text-muted)',
                border: activeQ === q.id ? `1.5px solid color-mix(in srgb, ${q.color} 30%, white)` : '1.5px solid var(--border)',
              }}
            >
              {q.emoji} Q{q.id}
              {count > 0 && <span style={{ marginLeft: 4 }}>({count})</span>}
            </button>
          );
        })}
      </div>

      {/* Mobile: single quadrant view */}
      <div className="md:hidden">
        {quadrants.filter(q => q.id === activeQ).map(q => {
          const qTasks = activeTasks.filter(t => t.quadrant === q.id);
          return (
            <div
              key={q.id}
              className="rounded-xl p-4 flex flex-col"
              style={{ background: 'var(--bg-card)', border: `1px solid var(--border)`, borderTop: `3px solid ${q.color}`, minHeight: '50vh' }}
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-sm flex items-center gap-2" style={{ color: q.color }}>
                    {q.emoji} {q.title}
                  </h3>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{q.subtitle}</p>
                </div>
                <button
                  onClick={() => { setEditingTask(null); setDefaultQuadrant(q.id); setModalOpen(true); }}
                  className="p-2 rounded-lg"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <Plus size={18} />
                </button>
              </div>

              <p className="text-xs mb-3 px-2 py-1 rounded" style={{ background: 'var(--bg)', color: 'var(--text-muted)' }}>{q.tip}</p>

              <div className="flex-1 space-y-2">
                {qTasks.length === 0 ? (
                  <p className="text-sm text-center py-8" style={{ color: 'var(--text-muted)' }}>No tasks in this quadrant</p>
                ) : qTasks.map(task => {
                  const role = roles.find(r => r.id === task.role_id);
                  return (
                    <div
                      key={task.id}
                      className="flex items-center gap-3 p-3 rounded-lg"
                      style={{ background: 'var(--bg)' }}
                    >
                      <button onClick={() => handleToggle(task)} className="checkbox" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{task.is_big_rock && '🪨 '}{task.title}</p>
                        {role && <span className="text-xs" style={{ color: role.color }}>{role.name}</span>}
                      </div>
                      <button
                        onClick={() => { setEditingTask(task); setModalOpen(true); }}
                        className="p-2 rounded-lg"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        Edit
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="mt-3 pt-2 text-center" style={{ borderTop: '1px solid var(--border)' }}>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{qTasks.length} tasks</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop: 2x2 grid */}
      <div className="hidden md:grid grid-cols-2 gap-4" style={{ height: 'calc(100vh - 160px)' }}>
        {quadrants.map(q => {
          const qTasks = activeTasks.filter(t => t.quadrant === q.id);
          return (
            <div
              key={q.id}
              className="rounded-xl p-4 flex flex-col"
              style={{ background: 'var(--bg-card)', border: `1px solid var(--border)`, borderTop: `3px solid ${q.color}` }}
              onDragOver={e => e.preventDefault()}
              onDrop={e => handleDrop(e, q.id)}
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-sm flex items-center gap-2" style={{ color: q.color }}>
                    {q.emoji} {q.title}
                  </h3>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{q.subtitle}</p>
                </div>
                <button
                  onClick={() => { setEditingTask(null); setDefaultQuadrant(q.id); setModalOpen(true); }}
                  className="p-1 rounded"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <Plus size={16} />
                </button>
              </div>

              <p className="text-xs mb-3 px-2 py-1 rounded" style={{ background: 'var(--bg)', color: 'var(--text-muted)' }}>{q.tip}</p>

              <div className="flex-1 overflow-y-auto space-y-1.5">
                {qTasks.map(task => {
                  const role = roles.find(r => r.id === task.role_id);
                  return (
                    <div
                      key={task.id}
                      className="flex items-center gap-2 p-2 rounded-lg group cursor-move"
                      style={{ background: 'var(--bg)' }}
                      draggable
                      onDragStart={e => handleDragStart(e, task.id)}
                    >
                      <GripVertical size={12} style={{ color: 'var(--text-muted)' }} className="opacity-0 group-hover:opacity-100" />
                      <button onClick={() => handleToggle(task)} className="checkbox" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">
                          {task.is_big_rock && '🪨 '}{task.title}
                        </p>
                        {role && <span className="text-xs" style={{ color: role.color }}>{role.name}</span>}
                      </div>
                      <button
                        onClick={() => { setEditingTask(task); setModalOpen(true); }}
                        className="opacity-0 group-hover:opacity-100 text-xs"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        Edit
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="mt-2 pt-2 text-center" style={{ borderTop: '1px solid var(--border)' }}>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{qTasks.length} tasks</span>
              </div>
            </div>
          );
        })}
      </div>

      <TaskModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingTask(null); }}
        onSave={handleSave}
        task={editingTask}
        roles={roles}
        contexts={contexts}
        projects={projects}
      />
    </div>
  );
}

export default function Page() {
  return <AppShell><MatrixPage /></AppShell>;
}
