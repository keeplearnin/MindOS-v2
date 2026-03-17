'use client';

import AppShell from '@/components/AppShell';
import { useProjects, useRoles, useTasks, createProject, updateProject, createTask, updateTask } from '@/lib/hooks';
import { useState } from 'react';
import { FolderKanban, Plus, ChevronDown, ChevronRight, Check, Circle, Archive } from 'lucide-react';

function ProjectsPage() {
  const { data: projects, refetch: refetchProjects } = useProjects();
  const { data: somedayProjects, refetch: refetchSomeday } = useProjects('someday');
  const { data: roles } = useRoles();
  const { data: tasks, refetch: refetchTasks } = useTasks();
  const [expanded, setExpanded] = useState(new Set());
  const [showCreate, setShowCreate] = useState(false);
  const [tab, setTab] = useState('active');
  const [form, setForm] = useState({ title: '', description: '', role_id: '', desired_outcome: '', status: 'active' });

  const toggleExpand = (id) => {
    const next = new Set(expanded);
    next.has(id) ? next.delete(id) : next.add(id);
    setExpanded(next);
  };

  const handleCreate = async () => {
    if (!form.title.trim()) return;
    await createProject({
      title: form.title,
      description: form.description || null,
      role_id: form.role_id || null,
      desired_outcome: form.desired_outcome || null,
      status: form.status,
    });
    setForm({ title: '', description: '', role_id: '', desired_outcome: '', status: 'active' });
    setShowCreate(false);
    refetchProjects();
    refetchSomeday();
  };

  const handleComplete = async (id) => {
    await updateProject(id, { status: 'completed' });
    refetchProjects();
  };

  const handleArchive = async (id) => {
    await updateProject(id, { status: 'archived' });
    refetchProjects();
    refetchSomeday();
  };

  const [newAction, setNewAction] = useState({});

  const handleAddAction = async (projectId) => {
    const title = newAction[projectId];
    if (!title?.trim()) return;
    const project = projects.find(p => p.id === projectId);
    await createTask({
      title,
      status: 'next_action',
      project_id: projectId,
      role_id: project?.role_id || null,
      quadrant: 2,
    });
    setNewAction({ ...newAction, [projectId]: '' });
    refetchTasks();
  };

  const handleToggleAction = async (task) => {
    if (task.status === 'done') {
      await updateTask(task.id, { status: 'next_action', completed_at: null });
    } else {
      await updateTask(task.id, { status: 'done', completed_at: new Date().toISOString() });
    }
    refetchTasks();
  };

  const displayProjects = tab === 'active' ? projects : somedayProjects;

  return (
    <div className="max-w-4xl animate-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FolderKanban size={24} style={{ color: 'var(--accent)' }} />
            Projects
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            GTD: Any outcome requiring more than one action step
          </p>
        </div>
        <button onClick={() => setShowCreate(!showCreate)} className="btn btn-primary">
          <Plus size={16} /> New Project
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 rounded-lg" style={{ background: 'var(--bg-card)' }}>
        <button className={`tab ${tab === 'active' ? 'active' : ''}`} onClick={() => setTab('active')}>
          Active ({projects.length})
        </button>
        <button className={`tab ${tab === 'someday' ? 'active' : ''}`} onClick={() => setTab('someday')}>
          Someday ({somedayProjects.length})
        </button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <div className="card mb-4 animate-in">
          <h3 className="font-semibold mb-3">New Project</h3>
          <div className="space-y-3">
            <input className="input" placeholder="Project title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} autoFocus />
            <textarea className="input" placeholder="Description" rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            <input className="input" placeholder="Desired outcome — What does 'done' look like?" value={form.desired_outcome} onChange={e => setForm({ ...form, desired_outcome: e.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <select className="input" value={form.role_id} onChange={e => setForm({ ...form, role_id: e.target.value })}>
                <option value="">Link to role</option>
                {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
              <select className="input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                <option value="active">Active</option>
                <option value="someday">Someday</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button onClick={handleCreate} className="btn btn-primary">Create</button>
              <button onClick={() => setShowCreate(false)} className="btn btn-ghost">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Projects List */}
      {displayProjects.length === 0 ? (
        <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
          No {tab} projects yet.
        </div>
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
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{project.title}</h3>
                      {role && <span className="badge" style={{ background: `${role.color}20`, color: role.color }}>{role.name}</span>}
                    </div>
                    {project.desired_outcome && (
                      <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>🎯 {project.desired_outcome}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex-1 h-1.5 rounded-full" style={{ background: 'var(--bg)' }}>
                        <div className="h-full rounded-full" style={{ width: `${projectTasks.length ? (doneTasks.length / projectTasks.length) * 100 : 0}%`, background: 'var(--q2)' }} />
                      </div>
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{doneTasks.length}/{projectTasks.length}</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={(e) => { e.stopPropagation(); handleComplete(project.id); }} className="p-1 rounded" style={{ color: 'var(--q2)' }} title="Complete">
                      <Check size={16} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleArchive(project.id); }} className="p-1 rounded" style={{ color: 'var(--text-muted)' }} title="Archive">
                      <Archive size={16} />
                    </button>
                  </div>
                </div>

                {isOpen && (
                  <div className="mt-4 ml-7 space-y-2 animate-in">
                    {project.description && <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{project.description}</p>}
                    {projectTasks.filter(t => t.status !== 'deleted').map(task => (
                      <div key={task.id} className="flex items-center gap-2 p-2 rounded-lg" style={{ background: 'var(--bg)' }}>
                        <div className={`checkbox ${task.status === 'done' ? 'checked' : ''}`} style={{ width: 16, height: 16 }} onClick={() => handleToggleAction(task)}>
                          {task.status === 'done' && <Check size={10} color="white" strokeWidth={3} />}
                        </div>
                        <span className={`text-sm ${task.status === 'done' ? 'line-through opacity-50' : ''}`}>{task.title}</span>
                      </div>
                    ))}
                    {/* Add next action */}
                    <div className="flex gap-2">
                      <input
                        className="input flex-1"
                        placeholder="Add next action..."
                        value={newAction[project.id] || ''}
                        onChange={e => setNewAction({ ...newAction, [project.id]: e.target.value })}
                        onKeyDown={e => e.key === 'Enter' && handleAddAction(project.id)}
                      />
                      <button onClick={() => handleAddAction(project.id)} className="btn btn-ghost"><Plus size={14} /></button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function Page() {
  return <AppShell><ProjectsPage /></AppShell>;
}
