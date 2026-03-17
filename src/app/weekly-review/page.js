'use client';

import AppShell from '@/components/AppShell';
import { useAuth } from '@/lib/auth-context';
import { useTasks, useInbox, useProjects, useRoles } from '@/lib/hooks';
import { getSupabase } from '@/lib/supabase-browser';
import { useState, useEffect } from 'react';
import { ClipboardCheck, ChevronRight, CheckCircle2, Circle, Sparkles } from 'lucide-react';
import { format, startOfWeek } from 'date-fns';

const getWeekString = () => {
  const now = new Date();
  const start = startOfWeek(now, { weekStartsOn: 1 });
  const weekNum = Math.ceil((((now - new Date(now.getFullYear(), 0, 1)) / 86400000) + new Date(now.getFullYear(), 0, 1).getDay() + 1) / 7);
  return `${now.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
};

function WeeklyReviewPage() {
  const { user } = useAuth();
  const { data: tasks } = useTasks();
  const { data: inbox } = useInbox();
  const { data: projects } = useProjects();
  const { data: roles } = useRoles();
  const [review, setReview] = useState(null);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);

  const weekStr = getWeekString();

  // Load or create weekly review
  useEffect(() => {
    const load = async () => {
      const supabase = getSupabase();
      const { data } = await supabase
        .from('weekly_reviews')
        .select('*')
        .eq('week', weekStr)
        .single();

      if (data) {
        setReview(data);
      } else {
        const { data: newReview } = await supabase
          .from('weekly_reviews')
          .insert({ user_id: user.id, week: weekStr })
          .select()
          .single();
        setReview(newReview);
      }
      setLoading(false);
    };
    if (user) load();
  }, [user, weekStr]);

  const updateReview = async (updates) => {
    const supabase = getSupabase();
    const { data } = await supabase
      .from('weekly_reviews')
      .update(updates)
      .eq('id', review.id)
      .select()
      .single();
    setReview(data);
  };

  const activeTasks = tasks.filter(t => t.status !== 'done' && t.status !== 'deleted');
  const waitingFor = tasks.filter(t => t.status === 'waiting_for');
  const somedayTasks = tasks.filter(t => t.status === 'someday_maybe');
  const completedThisWeek = tasks.filter(t => t.completed_at && t.completed_at >= startOfWeek(new Date(), { weekStartsOn: 1 }).toISOString());

  const steps = [
    {
      title: '📥 Get Clear: Empty Your Inbox',
      subtitle: 'GTD Step 1: Process every item in your inbox',
      field: 'inbox_cleared',
      content: () => (
        <div>
          <p className="text-sm mb-3" style={{ color: 'var(--text-muted)' }}>
            You have <strong style={{ color: 'var(--accent)' }}>{inbox.length}</strong> unprocessed inbox items.
            {inbox.length === 0 ? ' ✅ Inbox is clear!' : ' Process them before continuing.'}
          </p>
          {inbox.length > 0 && (
            <a href="/inbox" className="btn btn-primary">Go to Inbox →</a>
          )}
        </div>
      ),
    },
    {
      title: '✅ Get Current: Review Next Actions',
      subtitle: 'Are these still relevant? Update or remove stale items.',
      field: 'next_actions_reviewed',
      content: () => (
        <div>
          <p className="text-sm mb-3" style={{ color: 'var(--text-muted)' }}>
            You have <strong>{activeTasks.filter(t => t.status === 'next_action').length}</strong> next actions.
          </p>
          <a href="/tasks" className="btn btn-ghost">Review Tasks →</a>
        </div>
      ),
    },
    {
      title: '⏳ Follow Up: Waiting For',
      subtitle: 'Check on delegated items. Send follow-ups if needed.',
      field: 'waiting_for_followed_up',
      content: () => (
        <div>
          <p className="text-sm mb-3" style={{ color: 'var(--text-muted)' }}>
            You have <strong>{waitingFor.length}</strong> items waiting on others.
          </p>
          {waitingFor.slice(0, 5).map(t => (
            <div key={t.id} className="p-2 rounded-lg mb-1" style={{ background: 'var(--bg)' }}>
              <p className="text-sm">{t.title}</p>
              {t.waiting_for_whom && <p className="text-xs" style={{ color: 'var(--warning)' }}>Waiting on: {t.waiting_for_whom}</p>}
            </div>
          ))}
        </div>
      ),
    },
    {
      title: '📁 Review Projects',
      subtitle: 'Each project needs at least one next action.',
      field: 'projects_reviewed',
      content: () => (
        <div>
          <p className="text-sm mb-3" style={{ color: 'var(--text-muted)' }}>
            <strong>{projects.length}</strong> active projects.
          </p>
          {projects.map(p => {
            const projectActions = activeTasks.filter(t => t.project_id === p.id);
            const hasNextAction = projectActions.length > 0;
            return (
              <div key={p.id} className="flex items-center gap-2 p-2 rounded-lg mb-1" style={{ background: 'var(--bg)' }}>
                {hasNextAction ? <CheckCircle2 size={14} style={{ color: 'var(--q2)' }} /> : <Circle size={14} style={{ color: 'var(--danger)' }} />}
                <span className="text-sm flex-1">{p.title}</span>
                <span className="text-xs" style={{ color: hasNextAction ? 'var(--q2)' : 'var(--danger)' }}>
                  {hasNextAction ? `${projectActions.length} actions` : '⚠️ No next action!'}
                </span>
              </div>
            );
          })}
          <a href="/projects" className="btn btn-ghost mt-2">Manage Projects →</a>
        </div>
      ),
    },
    {
      title: '💭 Someday/Maybe',
      subtitle: 'Anything here ready to activate? Anything to remove?',
      field: 'someday_maybe_reviewed',
      content: () => (
        <div>
          <p className="text-sm mb-3" style={{ color: 'var(--text-muted)' }}>
            <strong>{somedayTasks.length}</strong> someday/maybe items.
          </p>
        </div>
      ),
    },
    {
      title: '🎭 Review Your Roles (7 Habits)',
      subtitle: 'Am I neglecting any role? Set intentions for each.',
      field: 'roles_reviewed',
      content: () => (
        <div className="space-y-2">
          {roles.map(role => {
            const roleTasks = activeTasks.filter(t => t.role_id === role.id);
            return (
              <div key={role.id} className="p-3 rounded-lg" style={{ background: 'var(--bg)', borderLeft: `3px solid ${role.color}` }}>
                <p className="font-medium text-sm" style={{ color: role.color }}>{role.name}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{roleTasks.length} active tasks</p>
                {role.description && <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{role.description}</p>}
              </div>
            );
          })}
        </div>
      ),
    },
    {
      title: '🪨 Set Big Rocks for Next Week',
      subtitle: 'Habit 3: What are the most important things to accomplish?',
      field: 'big_rocks_set',
      content: () => {
        const bigRocks = activeTasks.filter(t => t.is_big_rock);
        return (
          <div>
            <p className="text-sm mb-3" style={{ color: 'var(--text-muted)' }}>
              Current big rocks: <strong>{bigRocks.length}</strong>
            </p>
            {bigRocks.map(t => (
              <div key={t.id} className="p-2 rounded-lg mb-1" style={{ background: 'var(--bg)' }}>
                <p className="text-sm">🪨 {t.title}</p>
              </div>
            ))}
            <a href="/matrix" className="btn btn-ghost mt-2">Set Big Rocks in Matrix →</a>
          </div>
        );
      },
    },
    {
      title: '🌟 Reflect & Celebrate',
      subtitle: 'Acknowledge your wins and set intentions.',
      field: null,
      content: () => (
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium mb-2">🏆 Wins this week ({completedThisWeek.length} tasks completed)</p>
            <textarea
              className="input"
              rows={3}
              placeholder="What went well this week?"
              value={review?.wins || ''}
              onChange={e => updateReview({ wins: e.target.value })}
            />
          </div>
          <div>
            <p className="text-sm font-medium mb-2">📈 What to improve?</p>
            <textarea
              className="input"
              rows={3}
              placeholder="What could be better?"
              value={review?.improvements || ''}
              onChange={e => updateReview({ improvements: e.target.value })}
            />
          </div>
          <div>
            <p className="text-sm font-medium mb-2">🙏 Gratitude</p>
            <textarea
              className="input"
              rows={2}
              placeholder="What are you grateful for?"
              value={review?.gratitude || ''}
              onChange={e => updateReview({ gratitude: e.target.value })}
            />
          </div>
          <button
            onClick={() => updateReview({ completed_at: new Date().toISOString() })}
            className="btn btn-primary w-full py-3 text-base"
          >
            <Sparkles size={18} /> Complete Weekly Review
          </button>
        </div>
      ),
    },
  ];

  if (loading) return <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>Loading...</div>;

  const currentStep = steps[step];

  return (
    <div className="max-w-3xl animate-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ClipboardCheck size={24} style={{ color: 'var(--accent)' }} />
            Weekly Review
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Week of {weekStr} — GTD + 7 Habits combined review
          </p>
        </div>
        {review?.completed_at && (
          <span className="badge px-3 py-1" style={{ background: 'var(--q2)20', color: 'var(--q2)' }}>
            ✅ Completed
          </span>
        )}
      </div>

      {/* Progress */}
      <div className="flex gap-1 mb-6">
        {steps.map((s, i) => (
          <div
            key={i}
            className="h-1.5 flex-1 rounded-full cursor-pointer"
            style={{ background: i <= step ? 'var(--accent)' : 'var(--border)' }}
            onClick={() => setStep(i)}
          />
        ))}
      </div>

      {/* Step indicator */}
      <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>Step {step + 1} of {steps.length}</p>

      {/* Current Step */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-1">{currentStep.title}</h2>
        <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>{currentStep.subtitle}</p>

        {currentStep.content()}

        <div className="flex items-center justify-between mt-6 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
          <button
            onClick={() => setStep(Math.max(0, step - 1))}
            className="btn btn-ghost"
            disabled={step === 0}
          >
            ← Previous
          </button>

          {currentStep.field && (
            <button
              onClick={() => {
                updateReview({ [currentStep.field]: true });
                setStep(Math.min(steps.length - 1, step + 1));
              }}
              className="btn btn-primary"
            >
              Mark Done & Next →
            </button>
          )}

          {!currentStep.field && step < steps.length - 1 && (
            <button onClick={() => setStep(step + 1)} className="btn btn-primary">
              Next →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  return <AppShell><WeeklyReviewPage /></AppShell>;
}
