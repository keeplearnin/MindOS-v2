'use client';

import AppShell from '@/components/AppShell';
import { useAuth } from '@/lib/auth-context';
import { fetchTaskLists, fetchGoogleTasks, createGoogleTask, completeGoogleTask, deleteGoogleTask } from '@/lib/google-tasks';
import { createTask, createInboxItem } from '@/lib/hooks';
import { useState, useEffect } from 'react';
import {
  ListTodo, RefreshCw, Check, ArrowRight, Plus, ChevronDown,
  Download, Upload, CheckCircle2, Circle
} from 'lucide-react';

function GoogleTasksPage() {
  const { getGoogleToken } = useAuth();
  const [taskLists, setTaskLists] = useState([]);
  const [selectedList, setSelectedList] = useState('@default');
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [imported, setImported] = useState(new Set());
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [showCompleted, setShowCompleted] = useState(false);
  const [creating, setCreating] = useState(false);

  const token = getGoogleToken();

  const loadTaskLists = async () => {
    if (!token) return;
    try {
      const lists = await fetchTaskLists(token);
      setTaskLists(lists);
      if (lists.length > 0 && selectedList === '@default') {
        setSelectedList(lists[0].id);
      }
    } catch (err) {
      console.error('Failed to load task lists:', err);
    }
  };

  const loadTasks = async (listId) => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchGoogleTasks(token, listId || selectedList, showCompleted);
      setTasks(data);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (token) {
      loadTaskLists();
    }
  }, [token]);

  useEffect(() => {
    if (token && selectedList) {
      loadTasks(selectedList);
    }
  }, [token, selectedList, showCompleted]);

  const handleImportToMindOS = async (gTask) => {
    try {
      await createTask({
        title: gTask.title,
        notes: gTask.notes || null,
        status: 'next_action',
        quadrant: 2,
        due_date: gTask.due ? gTask.due.split('T')[0] : null,
      });
      setImported(prev => new Set([...prev, gTask.id]));
    } catch (err) {
      console.error('Failed to import task:', err);
    }
  };

  const handleImportAll = async () => {
    const pending = tasks.filter(t => t.status !== 'completed' && !imported.has(t.id));
    for (const t of pending) {
      await handleImportToMindOS(t);
    }
  };

  const handleCreateGoogleTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || creating) return;
    setCreating(true);
    try {
      await createGoogleTask(token, selectedList, { title: newTaskTitle.trim() });
      setNewTaskTitle('');
      loadTasks();
    } catch (err) {
      console.error('Failed to create Google Task:', err);
    }
    setCreating(false);
  };

  const handleComplete = async (gTask) => {
    try {
      await completeGoogleTask(token, selectedList, gTask.id);
      loadTasks();
    } catch (err) {
      console.error('Failed to complete task:', err);
    }
  };

  if (!token) {
    return (
      <div className="max-w-3xl animate-in">
        <h1 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <ListTodo size={24} style={{ color: 'var(--accent)' }} />
          Google Tasks
        </h1>
        <div className="card text-center py-12">
          <div className="text-4xl mb-4">🔒</div>
          <p className="text-lg font-medium mb-2">Google Tasks Access Required</p>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Sign out and sign back in to grant Google Tasks access.
          </p>
        </div>
      </div>
    );
  }

  const pendingTasks = tasks.filter(t => t.status !== 'completed');
  const completedTasks = tasks.filter(t => t.status === 'completed');

  return (
    <div className="max-w-3xl animate-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ListTodo size={24} style={{ color: 'var(--accent)' }} />
            Google Tasks
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Sync your Google Tasks with MindOS
          </p>
        </div>
        <div className="flex items-center gap-2">
          {pendingTasks.length > 0 && (
            <button onClick={handleImportAll} className="btn btn-ghost text-sm">
              <Download size={14} /> Import All to MindOS
            </button>
          )}
          <button onClick={() => loadTasks()} className="btn btn-ghost" disabled={loading}>
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Task list selector + add new */}
      <div className="flex gap-3 mb-4">
        {taskLists.length > 0 && (
          <select
            className="input"
            style={{ maxWidth: 200 }}
            value={selectedList}
            onChange={e => setSelectedList(e.target.value)}
          >
            {taskLists.map(list => (
              <option key={list.id} value={list.id}>{list.title}</option>
            ))}
          </select>
        )}
        <form onSubmit={handleCreateGoogleTask} className="flex-1 flex gap-2">
          <input
            className="input"
            placeholder="Add a new Google Task..."
            value={newTaskTitle}
            onChange={e => setNewTaskTitle(e.target.value)}
          />
          <button type="submit" className="btn btn-primary" disabled={creating || !newTaskTitle.trim()}>
            <Plus size={16} /> Add
          </button>
        </form>
      </div>

      {/* Show completed toggle */}
      <div className="flex items-center gap-4 mb-4">
        <label className="flex items-center gap-2 cursor-pointer text-sm" style={{ color: 'var(--text-muted)' }}>
          <input
            type="checkbox"
            checked={showCompleted}
            onChange={e => setShowCompleted(e.target.checked)}
            className="w-4 h-4 rounded"
          />
          Show completed
        </label>
      </div>

      {error && (
        <div className="card mb-4" style={{ borderColor: 'var(--danger)' }}>
          <p className="text-sm" style={{ color: 'var(--danger)' }}>{error}</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            You may need to sign out and sign back in to grant Google Tasks access.
          </p>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
          <RefreshCw size={24} className="animate-spin mx-auto mb-2" />
          Loading tasks...
        </div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
          <ListTodo size={32} className="mx-auto mb-3 opacity-40" />
          <p className="text-lg">No tasks found</p>
          <p className="text-sm mt-1">Add tasks above or create them in Google Tasks</p>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Pending tasks */}
          {pendingTasks.map(gTask => {
            const isImported = imported.has(gTask.id);
            return (
              <div key={gTask.id} className="card flex items-start gap-3">
                <button
                  onClick={() => handleComplete(gTask)}
                  className="mt-0.5 shrink-0"
                  title="Complete in Google Tasks"
                >
                  <Circle size={18} style={{ color: 'var(--border)' }} />
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{gTask.title}</p>
                  {gTask.notes && (
                    <p className="text-xs mt-0.5 line-clamp-2" style={{ color: 'var(--text-muted)' }}>
                      {gTask.notes}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="gtasks-badge">Google Tasks</span>
                    {gTask.due && (
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        Due: {new Date(gTask.due).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleImportToMindOS(gTask)}
                  className={`btn text-sm ${isImported ? 'btn-ghost' : 'btn-primary'}`}
                  disabled={isImported}
                >
                  {isImported ? <><Check size={14} /> Imported</> : <><ArrowRight size={14} /> To MindOS</>}
                </button>
              </div>
            );
          })}

          {/* Completed tasks */}
          {showCompleted && completedTasks.length > 0 && (
            <>
              <div className="pt-4 pb-2">
                <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                  Completed ({completedTasks.length})
                </p>
              </div>
              {completedTasks.map(gTask => (
                <div key={gTask.id} className="card flex items-start gap-3 opacity-50">
                  <CheckCircle2 size={18} className="mt-0.5 shrink-0" style={{ color: 'var(--success)' }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm line-through">{gTask.title}</p>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function Page() {
  return <AppShell><GoogleTasksPage /></AppShell>;
}
