'use client';

import AppShell from '@/components/AppShell';
import TaskCard from '@/components/TaskCard';
import TaskModal from '@/components/TaskModal';
import { useTasks, useRoles, useContexts, useProjects, createTask, updateTask, deleteTask } from '@/lib/hooks';
import { useAuth } from '@/lib/auth-context';
import { fetchTaskLists, fetchGoogleTasks, completeGoogleTask } from '@/lib/google-tasks';
import { useState, useEffect, useCallback } from 'react';
import { Plus, Check, Clock, Download, RefreshCw, MoreHorizontal, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';

// ---------------------------------------------------------------------------
// Google Task Card (inline, styled similarly to TaskCard)
// ---------------------------------------------------------------------------
function GoogleTaskCard({ gTask, taskListId, onComplete, onImport }) {
  const [showMenu, setShowMenu] = useState(false);
  const isDone = gTask.status === 'completed';
  const hasDue = gTask.due && gTask.due !== '0000-00-00T00:00:00.000Z';
  const isOverdue = hasDue && new Date(gTask.due) < new Date() && !isDone;

  return (
    <div
      className={`card slide-in flex items-start gap-3 ${isDone ? 'opacity-50' : ''}`}
      style={{ borderLeft: '3px solid var(--accent)' }}
    >
      {/* Checkbox */}
      <div
        className={`checkbox mt-0.5 ${isDone ? 'checked' : ''}`}
        onClick={() => !isDone && onComplete(taskListId, gTask.id)}
        style={{ cursor: isDone ? 'default' : 'pointer' }}
      >
        {isDone && <Check size={12} color="white" strokeWidth={3} />}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-medium ${isDone ? 'line-through' : ''}`}
          style={{ color: isDone ? 'var(--text-muted)' : 'var(--text)' }}
        >
          {gTask.title}
        </p>

        {gTask.notes && (
          <p className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--text-muted)' }}>
            {gTask.notes}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2 mt-2">
          {/* Google Tasks badge */}
          <span
            className="badge flex items-center gap-1"
            style={{ background: '#4285f415', color: '#4285f4', fontSize: '0.65rem' }}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M22 5.18L10.59 16.6l-4.24-4.24 1.41-1.41 2.83 2.83 10-10L22 5.18zM19.79 10.22C19.92 10.79 20 11.39 20 12c0 4.42-3.58 8-8 8s-8-3.58-8-8 3.58-8 8-8c1.58 0 3.04.46 4.28 1.25l1.44-1.44A9.9 9.9 0 0012 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10c0-1.19-.22-2.33-.6-3.39l-1.61 1.61z"/></svg>
            Google Tasks
          </span>

          {hasDue && (
            <span
              className="badge flex items-center gap-1"
              style={{
                background: isOverdue ? 'var(--danger-bg)' : 'var(--bg)',
                color: isOverdue ? 'var(--danger)' : 'var(--text-muted)',
              }}
            >
              <Clock size={10} />
              {format(new Date(gTask.due), 'MMM d')}
            </span>
          )}

          {gTask.parent && (
            <span className="badge" style={{ background: 'var(--bg)', color: 'var(--text-muted)', fontSize: '0.65rem' }}>
              sub-task
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
            <div
              className="absolute right-0 top-8 z-20 rounded-lg py-1 min-w-[160px]"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)' }}
            >
              {!isDone && (
                <button
                  className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:opacity-80"
                  style={{ color: 'var(--text)' }}
                  onClick={() => { onComplete(taskListId, gTask.id); setShowMenu(false); }}
                >
                  <Check size={14} /> Complete
                </button>
              )}
              <button
                className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:opacity-80"
                style={{ color: 'var(--accent)' }}
                onClick={() => { onImport(gTask); setShowMenu(false); }}
              >
                <Download size={14} /> Import to MindOS
              </button>
              {gTask.webViewLink && (
                <a
                  href={gTask.webViewLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:opacity-80"
                  style={{ color: 'var(--text-muted)' }}
                  onClick={() => setShowMenu(false)}
                >
                  <ExternalLink size={14} /> Open in Google
                </a>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main TasksPage
// ---------------------------------------------------------------------------
function TasksPage() {
  const { data: tasks } = useTasks();
  const { data: roles } = useRoles();
  const { data: contexts } = useContexts();
  const { data: projects } = useProjects();
  const { getGoogleToken } = useAuth();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [filter, setFilter] = useState('next_action');

  // Google Tasks state
  const [googleTasks, setGoogleTasks] = useState([]);
  const [googleTaskLists, setGoogleTaskLists] = useState([]);
  const [selectedTaskList, setSelectedTaskList] = useState('@default');
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState(null);
  const [showGoogleCompleted, setShowGoogleCompleted] = useState(false);

  // ---------- Fetch Google Tasks ----------
  const loadGoogleTasks = useCallback(async () => {
    setGoogleLoading(true);
    setGoogleError(null);
    try {
      const token = await getGoogleToken();
      if (!token) {
        setGoogleError('Not signed in to Google');
        setGoogleLoading(false);
        return;
      }
      const [lists, gTasks] = await Promise.all([
        fetchTaskLists(token),
        fetchGoogleTasks(token, selectedTaskList, showGoogleCompleted),
      ]);
      setGoogleTaskLists(lists);
      setGoogleTasks(gTasks);
    } catch (err) {
      console.error('Google Tasks fetch error:', err);
      setGoogleError(err.message || 'Failed to load Google Tasks');
    } finally {
      setGoogleLoading(false);
    }
  }, [getGoogleToken, selectedTaskList, showGoogleCompleted]);

  useEffect(() => {
    if (filter === 'google' || filter === 'all_sources') {
      loadGoogleTasks();
    }
  }, [filter, loadGoogleTasks]);

  // ---------- MindOS task handlers ----------
  const filtered = tasks.filter(t => {
    if (filter === 'all') return t.status !== 'deleted';
    if (filter === 'done') return t.status === 'done';
    if (filter === 'all_sources') return t.status !== 'deleted';
    if (filter === 'google') return false; // pure Google tab shows no MindOS tasks
    return t.status === filter;
  });

  const handleToggle = async (task) => {
    if (task.status === 'done') {
      await updateTask(task.id, { status: 'next_action', completed_at: null });
    } else {
      await updateTask(task.id, { status: 'done', completed_at: new Date().toISOString() });
    }
  };

  const handleSave = async (data) => {
    if (editingTask) {
      await updateTask(editingTask.id, data);
    } else {
      await createTask(data);
    }
    setModalOpen(false);
    setEditingTask(null);
  };

  const handleEdit = (task) => {
    setEditingTask(task);
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    await deleteTask(id);
  };

  // ---------- Google Task handlers ----------
  const handleGoogleComplete = async (taskListId, taskId) => {
    try {
      const token = await getGoogleToken();
      await completeGoogleTask(token, taskListId, taskId);
      // Optimistic: mark completed locally
      setGoogleTasks(prev =>
        prev.map(t => (t.id === taskId ? { ...t, status: 'completed' } : t))
      );
    } catch (err) {
      console.error('Error completing Google Task:', err);
    }
  };

  const handleImportGoogleTask = async (gTask) => {
    const data = {
      title: gTask.title,
      notes: gTask.notes || '',
      status: gTask.status === 'completed' ? 'done' : 'next_action',
      due_date: gTask.due || null,
      completed_at: gTask.status === 'completed' ? gTask.completed || new Date().toISOString() : null,
    };
    await createTask(data);
  };

  // ---------- Tabs ----------
  const tabs = [
    { key: 'next_action', label: 'Next Actions' },
    { key: 'waiting_for', label: 'Waiting For' },
    { key: 'someday_maybe', label: 'Someday/Maybe' },
    { key: 'done', label: 'Done' },
    { key: 'all', label: 'All' },
    { key: 'google', label: 'Google Tasks' },
    { key: 'all_sources', label: 'All Sources' },
  ];

  const countForTab = (key) => {
    if (key === 'google') return googleTasks.length;
    if (key === 'all_sources') return null; // too dynamic to show reliably
    if (key === 'all') return tasks.filter(t => t.status !== 'deleted').length;
    if (key === 'done') return tasks.filter(t => t.status === 'done').length;
    return tasks.filter(t => t.status === key).length;
  };

  // Decide which Google Tasks to show in the merged view
  const showGoogle = filter === 'google' || filter === 'all_sources';
  const activeGoogleTasks = showGoogleCompleted
    ? googleTasks
    : googleTasks.filter(t => t.status !== 'completed');

  return (
    <div className="max-w-4xl animate-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Tasks</h1>
        <button
          onClick={() => { setEditingTask(null); setModalOpen(true); }}
          className="btn btn-primary"
        >
          <Plus size={16} /> New Task
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 rounded-lg overflow-x-auto" style={{ background: 'var(--bg-card)' }}>
        {tabs.map(tab => (
          <button
            key={tab.key}
            className={`tab whitespace-nowrap ${filter === tab.key ? 'active' : ''}`}
            onClick={() => setFilter(tab.key)}
          >
            {tab.label}
            {countForTab(tab.key) !== null && (
              <span className="ml-1 text-xs opacity-60">{countForTab(tab.key)}</span>
            )}
          </button>
        ))}
      </div>

      {/* Google Tasks toolbar (shown on Google / All Sources tabs) */}
      {showGoogle && (
        <div className="flex flex-wrap items-center gap-3 mb-4">
          {googleTaskLists.length > 1 && (
            <select
              value={selectedTaskList}
              onChange={e => setSelectedTaskList(e.target.value)}
              className="text-sm rounded-md px-2 py-1"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text)' }}
            >
              {googleTaskLists.map(list => (
                <option key={list.id} value={list.id}>{list.title}</option>
              ))}
            </select>
          )}

          <label className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
            <input
              type="checkbox"
              checked={showGoogleCompleted}
              onChange={e => setShowGoogleCompleted(e.target.checked)}
            />
            Show completed
          </label>

          <button
            onClick={loadGoogleTasks}
            className="p-1.5 rounded hover:opacity-80"
            style={{ color: 'var(--text-muted)' }}
            title="Refresh Google Tasks"
          >
            <RefreshCw size={14} className={googleLoading ? 'animate-spin' : ''} />
          </button>

          {googleError && (
            <span className="text-xs" style={{ color: 'var(--danger)' }}>{googleError}</span>
          )}
        </div>
      )}

      {/* ---------- Task Lists ---------- */}

      {/* MindOS tasks (shown on all tabs except pure Google tab) */}
      {filter !== 'google' && (
        <>
          {filter === 'all_sources' && filtered.length > 0 && (
            <h3 className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>
              MindOS Tasks
            </h3>
          )}
          {filtered.length === 0 && filter !== 'all_sources' ? (
            <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
              <p>No tasks here yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  roles={roles}
                  contexts={contexts}
                  onToggle={handleToggle}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Google Tasks (shown on Google tab and All Sources tab) */}
      {showGoogle && (
        <>
          {filter === 'all_sources' && (
            <h3 className="text-xs font-semibold uppercase tracking-wide mb-2 mt-6" style={{ color: 'var(--text-muted)' }}>
              Google Tasks
            </h3>
          )}

          {googleLoading ? (
            <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}>
              <RefreshCw size={20} className="animate-spin mx-auto mb-2" />
              <p className="text-sm">Loading Google Tasks...</p>
            </div>
          ) : googleError && googleTasks.length === 0 ? (
            <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}>
              <p className="text-sm">{googleError}</p>
            </div>
          ) : activeGoogleTasks.length === 0 ? (
            <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}>
              <p className="text-sm">No Google Tasks found.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {activeGoogleTasks.map(gTask => (
                <GoogleTaskCard
                  key={gTask.id}
                  gTask={gTask}
                  taskListId={selectedTaskList}
                  onComplete={handleGoogleComplete}
                  onImport={handleImportGoogleTask}
                />
              ))}
            </div>
          )}
        </>
      )}

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
  return <AppShell><TasksPage /></AppShell>;
}
