'use client';

import AppShell from '@/components/AppShell';
import { useAuth } from '@/lib/auth-context';
import { useTasks, useInbox, useProjects, useRoles } from '@/lib/hooks';
import { Inbox, CheckSquare, Clock, AlertTriangle, Target, TrendingUp, Zap, FolderKanban } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

function StatCard({ icon: Icon, label, value, color, href }) {
  const inner = (
    <div className="card flex items-center gap-4">
      <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${color}15` }}>
        <Icon size={20} style={{ color }} />
      </div>
      <div>
        <p className="text-2xl font-bold" style={{ color: 'var(--text)' }}>{value}</p>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</p>
      </div>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

function Dashboard() {
  const { user } = useAuth();
  const { data: allTasks } = useTasks();
  const { data: inbox } = useInbox();
  const { data: projects } = useProjects();
  const { data: roles } = useRoles();

  const activeTasks = allTasks.filter(t => t.status !== 'done' && t.status !== 'deleted');
  const nextActions = allTasks.filter(t => t.status === 'next_action');
  const waitingFor = allTasks.filter(t => t.status === 'waiting_for');
  const overdue = activeTasks.filter(t => t.due_date && new Date(t.due_date) < new Date());
  const bigRocks = activeTasks.filter(t => t.is_big_rock);
  const q2Tasks = activeTasks.filter(t => t.quadrant === 2);
  const completedToday = allTasks.filter(t => t.completed_at && format(new Date(t.completed_at), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd'));

  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || 'there';

  return (
    <div className="max-w-6xl animate-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {firstName} 👋
        </h1>
        <p className="mt-1" style={{ color: 'var(--text-muted)' }}>
          {format(new Date(), 'EEEE, MMMM d, yyyy')} — Here&apos;s your productivity overview
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard icon={Inbox} label="Inbox Items" value={inbox.length} color="var(--accent)" href="/inbox" />
        <StatCard icon={CheckSquare} label="Next Actions" value={nextActions.length} color="var(--q2)" href="/tasks" />
        <StatCard icon={Clock} label="Waiting For" value={waitingFor.length} color="var(--warning)" href="/tasks" />
        <StatCard icon={AlertTriangle} label="Overdue" value={overdue.length} color="var(--danger)" href="/tasks" />
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Big Rocks This Week */}
        <div className="col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold flex items-center gap-2">
              <Target size={18} style={{ color: 'var(--q2)' }} />
              Big Rocks This Week
            </h2>
            <Link href="/tasks" className="text-xs" style={{ color: 'var(--accent)' }}>View all →</Link>
          </div>
          {bigRocks.length === 0 ? (
            <p className="text-sm py-4 text-center" style={{ color: 'var(--text-muted)' }}>
              No big rocks set. Do your weekly review to set priorities! 🪨
            </p>
          ) : (
            <div className="space-y-2">
              {bigRocks.slice(0, 5).map(task => {
                const role = roles.find(r => r.id === task.role_id);
                return (
                  <div key={task.id} className="flex items-center gap-3 p-2 rounded-lg" style={{ background: 'var(--bg)' }}>
                    <span className="text-lg">🪨</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{task.title}</p>
                      {role && <span className="text-xs" style={{ color: role.color }}>{role.name}</span>}
                    </div>
                    {task.due_date && (
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{format(new Date(task.due_date), 'MMM d')}</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="space-y-4">
          <div className="card">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Zap size={16} style={{ color: 'var(--warning)' }} />
              Today&apos;s Progress
            </h3>
            <div className="text-3xl font-bold" style={{ color: 'var(--q2)' }}>{completedToday.length}</div>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>tasks completed today</p>
          </div>

          <div className="card">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <TrendingUp size={16} style={{ color: 'var(--accent)' }} />
              Q2 Focus
            </h3>
            <div className="text-3xl font-bold" style={{ color: 'var(--q2)' }}>{q2Tasks.length}</div>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>important, not urgent tasks</p>
            <p className="text-xs mt-1" style={{ color: 'var(--q2)' }}>← This is where effectiveness lives</p>
          </div>

          <div className="card">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <FolderKanban size={16} style={{ color: 'var(--accent)' }} />
              Active Projects
            </h3>
            <div className="text-3xl font-bold" style={{ color: 'var(--accent)' }}>{projects.length}</div>
            <Link href="/projects" className="text-xs" style={{ color: 'var(--accent)' }}>Manage →</Link>
          </div>
        </div>
      </div>

      {/* Roles Overview */}
      <div className="mt-6 card">
        <h2 className="font-semibold mb-4">📊 Tasks by Role (7 Habits)</h2>
        <div className="grid grid-cols-4 gap-4">
          {roles.map(role => {
            const roleTasks = activeTasks.filter(t => t.role_id === role.id);
            return (
              <div key={role.id} className="p-3 rounded-lg" style={{ background: 'var(--bg)', borderLeft: `3px solid ${role.color}` }}>
                <p className="text-sm font-medium" style={{ color: role.color }}>{role.name}</p>
                <p className="text-2xl font-bold mt-1">{roleTasks.length}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>active tasks</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return <AppShell><Dashboard /></AppShell>;
}
