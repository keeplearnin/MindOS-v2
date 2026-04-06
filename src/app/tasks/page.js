'use client';

import AppShell from '@/components/AppShell';
import TaskCard from '@/components/TaskCard';
import TaskModal from '@/components/TaskModal';
import { useTasks, useRoles, useContexts, useProjects, createTask, updateTask, deleteTask, completeTask, createProject, updateProject } from '@/lib/hooks';
import { useAuth } from '@/lib/auth-context';
import { fetchTaskLists, fetchGoogleTasks, completeGoogleTask } from '@/lib/google-tasks';
import { useState, useEffect, useCallback } from 'react';
import { Plus, Check, Clock, Download, RefreshCw, MoreHorizontal, ExternalLink, List, Grid3X3, FolderKanban, GripVertical, ChevronDown, ChevronRight, Archive } from 'lucide-react';
import { format } from 'date-fns';

// ─── View Toggle ───────────────────────────────────────────────
const VIEWS = [
  { key: 'list', label: 'List', icon: List },
  { key: 'matrix', label: 'Matrix', icon: Grid3X3 },
  { key: 'projects', label: 'Projects', icon: FolderKanban },
];

// ─── Google Task Card ──────────────────────────────────────────
function GoogleTaskCard({ gTask, taskListId, onComplete, onImport }) {
  const [showMenu, setShowMenu] = useState(false);
  const isDone = gTask.status === 'completed';
  const hasDue = gTask.due && gTask.due !== '0000-00-00T00:00:00.000Z';
  const isOverdue = hasDue && new Date(gTask.due) < new Date() && !isDone;

  return (
    <div className={`card slide-in flex items-start gap-3 ${isDone ? 'opacity-50' : ''}`} style={{ borderLeft: '3px solid var(--accent)' }}>
      <div className={`checkbox mt-0.5 ${isDone ? 'checked' : ''}`} onClick={() => !isDone && onComplete(taskListId, gTask.id)} style={{ cursor: isDone ? 'default' : 'pointer' }}>
        {isDone && <Check size={12} color="white" strokeWidth={3} />}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${isDone ? 'line-through' : ''}`} style={{ color: isDone ? 'var(--text-muted)' : 'var(--text)' }}>{gTask.title}</p>
        {gTask.notes && <p className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--text-muted)' }}>{gTask.notes}</p>}
        <div className="flex flex-wrap items-center gap-2 mt-2">
          <span className="badge flex items-center gap-1" style={{ background: '#4285f415', color: '#4285f4', fontSize: '0.65rem' }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M22 5.18L10.59 16.6l-4.24-4.24 1.41-1.41 2.83 2.83 10-10L22 5.18zM19.79 10.22C19.92 10.79 20 11.39 20 12c0 4.42-3.58 8-8 8s-8-3.58-8-8 3.58-8 8-8c1.58 0 3.04.46 4.28 1.25l1.44-1.44A9.9 9.9 0 0012 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10c0-1.19-.22-2.33-.6-3.39l-1.61 1.61z"/></svg>
            Google Tasks
          </span>
          {hasDue && <span className="badge flex items-center gap-1" style={{ background: isOverdue ? 'var(--danger-bg)' : 'var(--bg)', color: isOverdue ? 'var(--danger)' : 'var(--text-muted)' }}><Clock size={10} />{format(new Date(gTask.due), 'MMM d')}</span>}
        </div>
      </div>
      <div className="relative">
        <button className="p-1 rounded" style={{ color: 'var(--text-muted)' }} onClick={() => setShowMenu(!showMenu)}><MoreHorizontal size={16} /></button>
        {showMenu && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
            <div className="absolute right-0 top-8 z-20 rounded-lg py-1 min-w-[160px]" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)' }}>
              {!isDone && <button className="w-full px-3 py-2 text-left text-sm flex items-center gap-2" style={{ color: 'var(--text)' }} onClick={() => { onComplete(taskListId, gTask.id); setShowMenu(false); }}><Check size={14} /> Complete</button>}
              <button className="w-full px-3 py-2 text-left text-sm flex items-center gap-2" style={{ color: 'var(--accent)' }} onClick={() => { onImport(gTask); setShowMenu(false); }}><Download size={14} /> Import to MindOS</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Matrix View ───────────────────────────────────────────────
const quadrants = [
  { id: 1, title: 'Q1: Do First', subtitle: 'Urgent + Important', color: 'var(--q1)', emoji: '🔥', tip: 'Crises, deadlines, emergencies' },
  { id: 2, title: 'Q2: Schedule', subtitle: 'Important, Not Urgent', color: 'var(--q2)', emoji: '🎯', tip: 'THE KEY TO EFFECTIVENESS' },
  { id: 3, title: 'Q3: Delegate', subtitle: 'Urgent, Not Important', color: 'var(--q3)', emoji: '📤', tip: 'Interruptions, some meetings' },
  { id: 4, title: 'Q4: Eliminate', subtitle: 'Not Urgent, Not Important', color: 'var(--q4)', emoji: '🗑️', tip: 'Time wasters, busy work' },
];

function MatrixView({ tasks, roles, contexts, projects, onEdit }) {
  const [defaultQuadrant, setDefaultQuadrant] = useState(2);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [activeQ, setActiveQ] = useState(2);

  const activeTasks = tasks.filter(t => t.status !== 'done' && t.status !== 'deleted');

  const handleToggle = async (task) => { await updateTask(task.id, { status: 'done', completed_at: new Date().toISOString() }); };
  const handleSave = async (data) => {
    if (editingTask) await updateTask(editingTask.id, data);
    else await createTask({ ...data, quadrant: data.quadrant || defaultQuadrant });
    setModalOpen(false); setEditingTask(null);
  };
  const handleDragStart = (e, taskId) => { e.dataTransfer.setData('taskId', taskId); };
  const handleDrop = async (e, quadrantId) => { e.preventDefault(); const taskId = e.dataTransfer.getData('taskId'); if (taskId) await updateTask(taskId, { quadrant: quadrantId }); };

  return (
    <>
      {/* Mobile quadrant tabs */}
      <div className="flex gap-1 mb-4 overflow-x-auto md:hidden">
        {quadrants.map(q => {
          const count = activeTasks.filter(t => t.quadrant === q.id).length;
          return (
            <button key={q.id} onClick={() => setActiveQ(q.id)} className="flex-1 min-w-0 py-2.5 px-2 rounded-lg text-xs font-semibold text-center"
              style={{ background: activeQ === q.id ? `color-mix(in srgb, ${q.color} 12%, white)` : 'var(--bg-card)', color: activeQ === q.id ? q.color : 'var(--text-muted)', border: activeQ === q.id ? `1.5px solid color-mix(in srgb, ${q.color} 30%, white)` : '1.5px solid var(--border)' }}>
              {q.emoji} Q{q.id}{count > 0 && <span style={{ marginLeft: 4 }}>({count})</span>}
            </button>
          );
        })}
      </div>

      {/* Mobile: single quadrant */}
      <div className="md:hidden">
        {quadrants.filter(q => q.id === activeQ).map(q => {
          const qTasks = activeTasks.filter(t => t.quadrant === q.id);
          return (
            <div key={q.id} className="rounded-xl p-4 flex flex-col" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderTop: `3px solid ${q.color}`, minHeight: '50vh' }}>
              <div className="flex items-center justify-between mb-3">
                <div><h3 className="font-semibold text-sm flex items-center gap-2" style={{ color: q.color }}>{q.emoji} {q.title}</h3><p className="text-xs" style={{ color: 'var(--text-muted)' }}>{q.subtitle}</p></div>
                <button onClick={() => { setEditingTask(null); setDefaultQuadrant(q.id); setModalOpen(true); }} className="p-2 rounded-lg" style={{ color: 'var(--text-muted)' }}><Plus size={18} /></button>
              </div>
              <p className="text-xs mb-3 px-2 py-1 rounded" style={{ background: 'var(--bg)', color: 'var(--text-muted)' }}>{q.tip}</p>
              <div className="flex-1 space-y-2">
                {qTasks.length === 0 ? <p className="text-sm text-center py-8" style={{ color: 'var(--text-muted)' }}>No tasks</p> : qTasks.map(task => {
                  const role = roles.find(r => r.id === task.role_id);
                  return (
                    <div key={task.id} className="flex items-center gap-3 p-3 rounded-lg" style={{ background: 'var(--bg)' }}>
                      <button onClick={() => handleToggle(task)} className="checkbox" />
                      <div className="flex-1 min-w-0"><p className="text-sm font-medium">{task.is_big_rock && '🪨 '}{task.title}</p>{role && <span className="text-xs" style={{ color: role.color }}>{role.name}</span>}</div>
                      <button onClick={() => { setEditingTask(task); setModalOpen(true); }} className="p-2 rounded-lg" style={{ color: 'var(--text-muted)' }}>Edit</button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop: 2x2 grid */}
      <div className="hidden md:grid grid-cols-2 gap-4" style={{ height: 'calc(100vh - 200px)' }}>
        {quadrants.map(q => {
          const qTasks = activeTasks.filter(t => t.quadrant === q.id);
          return (
            <div key={q.id} className="rounded-xl p-4 flex flex-col" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderTop: `3px solid ${q.color}` }}
              onDragOver={e => e.preventDefault()} onDrop={e => handleDrop(e, q.id)}>
              <div className="flex items-center justify-between mb-3">
                <div><h3 className="font-semibold text-sm flex items-center gap-2" style={{ color: q.color }}>{q.emoji} {q.title}</h3><p className="text-xs" style={{ color: 'var(--text-muted)' }}>{q.subtitle}</p></div>
                <button onClick={() => { setEditingTask(null); setDefaultQuadrant(q.id); setModalOpen(true); }} className="p-1 rounded" style={{ color: 'var(--text-muted)' }}><Plus size={16} /></button>
              </div>
              <p className="text-xs mb-3 px-2 py-1 rounded" style={{ background: 'var(--bg)', color: 'var(--text-muted)' }}>{q.tip}</p>
              <div className="flex-1 overflow-y-auto space-y-1.5">
                {qTasks.map(task => {
                  const role = roles.find(r => r.id === task.role_id);
                  return (
                    <div key={task.id} className="flex items-center gap-2 p-2 rounded-lg group cursor-move" style={{ background: 'var(--bg)' }} draggable onDragStart={e => handleDragStart(e, task.id)}>
                      <GripVertical size={12} style={{ color: 'var(--text-muted)' }} className="opacity-0 group-hover:opacity-100" />
                      <button onClick={() => handleToggle(task)} className="checkbox" />
                      <div className="flex-1 min-w-0"><p className="text-xs font-medium truncate">{task.is_big_rock && '🪨 '}{task.title}</p>{role && <span className="text-xs" style={{ color: role.color }}>{role.name}</span>}</div>
                      <button onClick={() => { setEditingTask(task); setModalOpen(true); }} className="opacity-0 group-hover:opacity-100 text-xs" style={{ color: 'var(--text-muted)' }}>Edit</button>
                    </div>
                  );
                })}
              </div>
              <div className="mt-2 pt-2 text-center" style={{ borderTop: '1px solid var(--border)' }}><span className="text-xs" style={{ color: 'var(--text-muted)' }}>{qTasks.length} tasks</span></div>
            </div>
          );
        })}
      </div>

      <TaskModal open={modalOpen} onClose={() => { setModalOpen(false); setEditingTask(null); }} onSave={handleSave} task={editingTask} roles={roles} contexts={contexts} projects={projects} />
    </>
  );
}

// ─── Projects View ─────────────────────────────────────────────
function ProjectsView({ tasks, roles }) {
  const { data: activeProjects, refetch: refetchProjects } = useProjects();
  const { data: somedayProjects, refetch: refetchSomeday } = useProjects('someday');
  const [expanded, setExpanded] = useState(new Set());
  const [showCreate, setShowCreate] = useState(false);
  const [tab, setTab] = useState('active');
  const [form, setForm] = useState({ title: '', description: '', role_id: '', desired_outcome: '', status: 'active' });
  const [newAction, setNewAction] = useState({});

  const toggleExpand = (id) => { const next = new Set(expanded); next.has(id) ? next.delete(id) : next.add(id); setExpanded(next); };

  const handleCreate = async () => {
    if (!form.title.trim()) return;
    await createProject({ title: form.title, description: form.description || null, role_id: form.role_id || null, desired_outcome: form.desired_outcome || null, status: form.status });
    setForm({ title: '', description: '', role_id: '', desired_outcome: '', status: 'active' }); setShowCreate(false); refetchProjects(); refetchSomeday();
  };

  const handleAddAction = async (projectId) => {
    const title = newAction[projectId]; if (!title?.trim()) return;
    const project = activeProjects.find(p => p.id === projectId);
    await createTask({ title, status: 'next_action', project_id: projectId, role_id: project?.role_id || null, quadrant: 2 });
    setNewAction({ ...newAction, [projectId]: '' });
  };

  const handleToggleAction = async (task) => {
    if (task.status === 'done') await updateTask(task.id, { status: 'next_action', completed_at: null });
    else await updateTask(task.id, { status: 'done', completed_at: new Date().toISOString() });
  };

  const displayProjects = tab === 'active' ? activeProjects : somedayProjects;

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-1 p-1 rounded-lg" style={{ background: 'var(--bg-card)' }}>
          <button className={`tab ${tab === 'active' ? 'active' : ''}`} onClick={() => setTab('active')}>Active ({activeProjects.length})</button>
          <button className={`tab ${tab === 'someday' ? 'active' : ''}`} onClick={() => setTab('someday')}>Someday ({somedayProjects.length})</button>
        </div>
        <button onClick={() => setShowCreate(!showCreate)} className="btn btn-primary"><Plus size={16} /> New Project</button>
      </div>

      {showCreate && (
        <div className="card mb-4 animate-in">
          <h3 className="font-semibold mb-3">New Project</h3>
          <div className="space-y-3">
            <input className="input" placeholder="Project title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} autoFocus />
            <textarea className="input" placeholder="Description" rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            <input className="input" placeholder="Desired outcome" value={form.desired_outcome} onChange={e => setForm({ ...form, desired_outcome: e.target.value })} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <select className="input" value={form.role_id} onChange={e => setForm({ ...form, role_id: e.target.value })}><option value="">Link to role</option>{roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}</select>
              <select className="input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}><option value="active">Active</option><option value="someday">Someday</option></select>
            </div>
            <div className="flex gap-2"><button onClick={handleCreate} className="btn btn-primary">Create</button><button onClick={() => setShowCreate(false)} className="btn btn-ghost">Cancel</button></div>
          </div>
        </div>
      )}

      {displayProjects.length === 0 ? (
        <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>No {tab} projects yet.</div>
      ) : (
        <div className="space-y-3">
          {displayProjects.map(project => {
            const role = roles.find(r => r.id === project.role_id);
            const projectTasks = tasks.filter(t => t.project_id === project.id);
            const doneTasks = projectTasks.filter(t => t.status === 'done');
            const isOpen = expanded.has(project.id);
            return (
              <div key={project.id} className="card">
                <div className="flex items-start gap-3 cursor-pointer" onClick={() => toggleExpand(project.id)}>
                  {isOpen ? <ChevronDown size={18} style={{ color: 'var(--text-muted)' }} /> : <ChevronRight size={18} style={{ color: 'var(--text-muted)' }} />}
                  <div className="flex-1">
                    <div className="flex items-center gap-2"><h3 className="font-medium">{project.title}</h3>{role && <span className="badge" style={{ background: `${role.color}20`, color: role.color }}>{role.name}</span>}</div>
                    {project.desired_outcome && <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>🎯 {project.desired_outcome}</p>}
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex-1 h-1.5 rounded-full" style={{ background: 'var(--bg)' }}><div className="h-full rounded-full" style={{ width: `${projectTasks.length ? (doneTasks.length / projectTasks.length) * 100 : 0}%`, background: 'var(--q2)' }} /></div>
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{doneTasks.length}/{projectTasks.length}</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={(e) => { e.stopPropagation(); updateProject(project.id, { status: 'completed' }); refetchProjects(); }} className="p-1 rounded" style={{ color: 'var(--q2)' }} title="Complete"><Check size={16} /></button>
                    <button onClick={(e) => { e.stopPropagation(); updateProject(project.id, { status: 'archived' }); refetchProjects(); refetchSomeday(); }} className="p-1 rounded" style={{ color: 'var(--text-muted)' }} title="Archive"><Archive size={16} /></button>
                  </div>
                </div>
                {isOpen && (
                  <div className="mt-4 ml-7 space-y-2 animate-in">
                    {project.description && <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{project.description}</p>}
                    {projectTasks.filter(t => t.status !== 'deleted').map(task => (
                      <div key={task.id} className="flex items-center gap-2 p-2 rounded-lg" style={{ background: 'var(--bg)' }}>
                        <div className={`checkbox ${task.status === 'done' ? 'checked' : ''}`} style={{ width: 16, height: 16 }} onClick={() => handleToggleAction(task)}>{task.status === 'done' && <Check size={10} color="white" strokeWidth={3} />}</div>
                        <span className={`text-sm ${task.status === 'done' ? 'line-through opacity-50' : ''}`}>{task.title}</span>
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <input className="input flex-1" placeholder="Add next action..." value={newAction[project.id] || ''} onChange={e => setNewAction({ ...newAction, [project.id]: e.target.value })} onKeyDown={e => e.key === 'Enter' && handleAddAction(project.id)} />
                      <button onClick={() => handleAddAction(project.id)} className="btn btn-ghost"><Plus size={14} /></button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

// ─── Main Tasks Page ───────────────────────────────────────────
function TasksPage() {
  const { data: tasks } = useTasks();
  const { data: roles } = useRoles();
  const { data: contexts } = useContexts();
  const { data: projects } = useProjects();
  const { getGoogleToken } = useAuth();

  const [view, setView] = useState('list');
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

  const loadGoogleTasks = useCallback(async () => {
    setGoogleLoading(true); setGoogleError(null);
    try {
      const token = await getGoogleToken();
      if (!token) { setGoogleError('Not signed in'); setGoogleLoading(false); return; }
      const [lists, gTasks] = await Promise.all([fetchTaskLists(token), fetchGoogleTasks(token, selectedTaskList, showGoogleCompleted)]);
      setGoogleTaskLists(lists); setGoogleTasks(gTasks);
    } catch (err) { setGoogleError(err.message || 'Failed to load'); }
    finally { setGoogleLoading(false); }
  }, [getGoogleToken, selectedTaskList, showGoogleCompleted]);

  useEffect(() => { if (filter === 'google' || filter === 'all_sources') loadGoogleTasks(); }, [filter, loadGoogleTasks]);

  const filtered = tasks.filter(t => {
    if (filter === 'all') return t.status !== 'deleted';
    if (filter === 'done') return t.status === 'done';
    if (filter === 'all_sources') return t.status !== 'deleted';
    if (filter === 'google') return false;
    return t.status === filter;
  });

  const handleToggle = async (task) => { if (task.status === 'done') await updateTask(task.id, { status: 'next_action', completed_at: null }); else await completeTask(task); };
  const handleSave = async (data) => { if (editingTask) await updateTask(editingTask.id, data); else await createTask(data); setModalOpen(false); setEditingTask(null); };
  const handleEdit = (task) => { setEditingTask(task); setModalOpen(true); };
  const handleDelete = async (id) => { await deleteTask(id); };
  const handleGoogleComplete = async (taskListId, taskId) => { try { const token = await getGoogleToken(); await completeGoogleTask(token, taskListId, taskId); setGoogleTasks(prev => prev.map(t => (t.id === taskId ? { ...t, status: 'completed' } : t))); } catch (err) { console.error(err); } };
  const handleImportGoogleTask = async (gTask) => { await createTask({ title: gTask.title, notes: gTask.notes || '', status: gTask.status === 'completed' ? 'done' : 'next_action', due_date: gTask.due || null, completed_at: gTask.status === 'completed' ? gTask.completed || new Date().toISOString() : null }); };

  const tabs = [
    { key: 'next_action', label: 'Next Actions' }, { key: 'waiting_for', label: 'Waiting For' },
    { key: 'someday_maybe', label: 'Someday/Maybe' }, { key: 'done', label: 'Done' },
    { key: 'all', label: 'All' }, { key: 'google', label: 'Google Tasks' }, { key: 'all_sources', label: 'All Sources' },
  ];
  const countForTab = (key) => { if (key === 'google') return googleTasks.length; if (key === 'all_sources') return null; if (key === 'all') return tasks.filter(t => t.status !== 'deleted').length; if (key === 'done') return tasks.filter(t => t.status === 'done').length; return tasks.filter(t => t.status === key).length; };

  const showGoogle = filter === 'google' || filter === 'all_sources';
  const activeGoogleTasks = showGoogleCompleted ? googleTasks : googleTasks.filter(t => t.status !== 'completed');

  return (
    <div className="max-w-4xl animate-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Tasks</h1>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex gap-0.5 p-0.5 rounded-lg" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            {VIEWS.map(v => {
              const Icon = v.icon;
              return (
                <button key={v.key} onClick={() => setView(v.key)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all"
                  style={{ background: view === v.key ? 'var(--accent)' : 'transparent', color: view === v.key ? 'white' : 'var(--text-muted)' }}>
                  <Icon size={14} /> {v.label}
                </button>
              );
            })}
          </div>
          {view === 'list' && (
            <button onClick={() => { setEditingTask(null); setModalOpen(true); }} className="btn btn-primary"><Plus size={16} /> New</button>
          )}
        </div>
      </div>

      {/* List View */}
      {view === 'list' && (
        <>
          <div className="flex gap-1 mb-6 p-1 rounded-lg overflow-x-auto" style={{ background: 'var(--bg-card)' }}>
            {tabs.map(tab => (
              <button key={tab.key} className={`tab whitespace-nowrap ${filter === tab.key ? 'active' : ''}`} onClick={() => setFilter(tab.key)}>
                {tab.label}{countForTab(tab.key) !== null && <span className="ml-1 text-xs opacity-60">{countForTab(tab.key)}</span>}
              </button>
            ))}
          </div>

          {showGoogle && (
            <div className="flex flex-wrap items-center gap-3 mb-4">
              {googleTaskLists.length > 1 && <select value={selectedTaskList} onChange={e => setSelectedTaskList(e.target.value)} className="text-sm rounded-md px-2 py-1" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text)' }}>{googleTaskLists.map(list => <option key={list.id} value={list.id}>{list.title}</option>)}</select>}
              <label className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}><input type="checkbox" checked={showGoogleCompleted} onChange={e => setShowGoogleCompleted(e.target.checked)} />Show completed</label>
              <button onClick={loadGoogleTasks} className="p-1.5 rounded" style={{ color: 'var(--text-muted)' }} title="Refresh"><RefreshCw size={14} className={googleLoading ? 'animate-spin' : ''} /></button>
              {googleError && <span className="text-xs" style={{ color: 'var(--danger)' }}>{googleError}</span>}
            </div>
          )}

          {filter !== 'google' && (
            <>
              {filter === 'all_sources' && filtered.length > 0 && <h3 className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>MindOS Tasks</h3>}
              {filtered.length === 0 && filter !== 'all_sources' ? (
                <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}><p>No tasks here yet.</p></div>
              ) : (
                <div className="space-y-2">{filtered.map(task => <TaskCard key={task.id} task={task} roles={roles} contexts={contexts} onToggle={handleToggle} onEdit={handleEdit} onDelete={handleDelete} />)}</div>
              )}
            </>
          )}

          {showGoogle && (
            <>
              {filter === 'all_sources' && <h3 className="text-xs font-semibold uppercase tracking-wide mb-2 mt-6" style={{ color: 'var(--text-muted)' }}>Google Tasks</h3>}
              {googleLoading ? <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}><RefreshCw size={20} className="animate-spin mx-auto mb-2" /><p className="text-sm">Loading...</p></div>
                : activeGoogleTasks.length === 0 ? <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}><p className="text-sm">No Google Tasks found.</p></div>
                : <div className="space-y-2">{activeGoogleTasks.map(gTask => <GoogleTaskCard key={gTask.id} gTask={gTask} taskListId={selectedTaskList} onComplete={handleGoogleComplete} onImport={handleImportGoogleTask} />)}</div>
              }
            </>
          )}

          <TaskModal open={modalOpen} onClose={() => { setModalOpen(false); setEditingTask(null); }} onSave={handleSave} task={editingTask} roles={roles} contexts={contexts} projects={projects} />
        </>
      )}

      {/* Matrix View */}
      {view === 'matrix' && <MatrixView tasks={tasks} roles={roles} contexts={contexts} projects={projects} />}

      {/* Projects View */}
      {view === 'projects' && <ProjectsView tasks={tasks} roles={roles} />}
    </div>
  );
}

export default function Page() {
  return <AppShell><TasksPage /></AppShell>;
}
