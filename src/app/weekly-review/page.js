'use client';

import AppShell from '@/components/AppShell';
import { useAuth } from '@/lib/auth-context';
import { useTasks, useInbox, useProjects, useRoles } from '@/lib/hooks';
import { getSupabase } from '@/lib/supabase-browser';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ClipboardCheck, ChevronRight, ChevronLeft, CheckCircle2, Circle, Sparkles,
  Inbox, ListChecks, Clock, FolderKanban, Lightbulb, Users, Mountain, Check, ArrowRight,
} from 'lucide-react';
import { format, startOfWeek, endOfWeek } from 'date-fns';

const getWeekString = () => {
  const now = new Date();
  const weekNum = Math.ceil((((now - new Date(now.getFullYear(), 0, 1)) / 86400000) + new Date(now.getFullYear(), 0, 1).getDay() + 1) / 7);
  return `${now.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
};

function Aurora() {
  return (
    <div className="aurora" aria-hidden="true">
      <span style={{ width: 420, height: 420, top: -120, left: '-8%', background: 'var(--accent)' }} />
      <span style={{ width: 360, height: 360, top: '32%', right: '-10%', background: 'var(--q2)', animationDelay: '-8s' }} />
      <span style={{ width: 300, height: 300, bottom: '-8%', left: '28%', background: 'var(--q3)', animationDelay: '-16s' }} />
    </div>
  );
}

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
      title: 'Empty your inbox',
      subtitle: 'Get clear — process every captured item',
      field: 'inbox_cleared',
      icon: Inbox,
      tone: 'var(--accent)',
      content: () => (
        <div>
          <Stat value={inbox.length} label={inbox.length === 1 ? 'unprocessed item' : 'unprocessed items'} tone={inbox.length === 0 ? 'var(--q2)' : 'var(--accent)'} />
          {inbox.length === 0
            ? <p className="text-sm mt-3" style={{ color: 'var(--q2)' }}>Inbox is clear. Nothing to process.</p>
            : <StepLink href="/inbox">Go to inbox</StepLink>}
        </div>
      ),
    },
    {
      title: 'Review next actions',
      subtitle: 'Get current — are these still relevant?',
      field: 'next_actions_reviewed',
      icon: ListChecks,
      tone: 'var(--accent)',
      content: () => (
        <div>
          <Stat value={activeTasks.filter(t => t.status === 'next_action').length} label="next actions" />
          <StepLink href="/tasks">Review tasks</StepLink>
        </div>
      ),
    },
    {
      title: 'Follow up on waiting-for',
      subtitle: 'Check delegated items and chase what has gone quiet',
      field: 'waiting_for_followed_up',
      icon: Clock,
      tone: 'var(--warning)',
      content: () => (
        <div>
          <Stat value={waitingFor.length} label="items waiting on others" tone="var(--warning)" />
          <div className="space-y-1.5 mt-3">
            {waitingFor.slice(0, 5).map(t => (
              <div key={t.id} className="glass-soft px-3 py-2">
                <p className="text-sm" style={{ color: 'var(--text)' }}>{t.title}</p>
                {t.waiting_for_whom && (
                  <p className="text-xs mt-0.5" style={{ color: 'var(--warning)' }}>Waiting on {t.waiting_for_whom}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      title: 'Review projects',
      subtitle: 'Every project needs at least one next action',
      field: 'projects_reviewed',
      icon: FolderKanban,
      tone: 'var(--accent)',
      content: () => (
        <div>
          <Stat value={projects.length} label="active projects" />
          <div className="space-y-1.5 mt-3">
            {projects.map(p => {
              const projectActions = activeTasks.filter(t => t.project_id === p.id);
              const ok = projectActions.length > 0;
              return (
                <div key={p.id} className="glass-soft flex items-center gap-2 px-3 py-2">
                  {ok
                    ? <CheckCircle2 size={14} style={{ color: 'var(--q2)', flexShrink: 0 }} />
                    : <Circle size={14} style={{ color: 'var(--danger)', flexShrink: 0 }} />}
                  <span className="text-sm flex-1 min-w-0 truncate" style={{ color: 'var(--text)' }}>{p.title}</span>
                  <span className="text-xs shrink-0" style={{ color: ok ? 'var(--q2)' : 'var(--danger)' }}>
                    {ok ? `${projectActions.length} actions` : 'No next action'}
                  </span>
                </div>
              );
            })}
          </div>
          <StepLink href="/tasks">Manage projects</StepLink>
        </div>
      ),
    },
    {
      title: 'Someday / maybe',
      subtitle: 'Anything ready to activate? Anything to let go?',
      field: 'someday_maybe_reviewed',
      icon: Lightbulb,
      tone: 'var(--q3)',
      content: () => (
        <div>
          <Stat value={somedayTasks.length} label="someday / maybe items" tone="var(--q3)" />
          <StepLink href="/tasks">Review the list</StepLink>
        </div>
      ),
    },
    {
      title: 'Review your roles',
      subtitle: '7 Habits — am I neglecting any part of my life?',
      field: 'roles_reviewed',
      icon: Users,
      tone: 'var(--q2)',
      content: () => (
        <div className="space-y-2">
          {roles.map(role => {
            const roleTasks = activeTasks.filter(t => t.role_id === role.id);
            return (
              <div key={role.id} className="glass-soft px-3 py-2.5" style={{ borderLeft: `3px solid ${role.color}` }}>
                <div className="flex items-baseline justify-between gap-2">
                  <p className="font-medium text-sm" style={{ color: role.color }}>{role.name}</p>
                  <p className="text-xs shrink-0" style={{ color: 'var(--text-muted)' }}>{roleTasks.length} active</p>
                </div>
                {role.description && <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{role.description}</p>}
              </div>
            );
          })}
        </div>
      ),
    },
    {
      title: 'Set next week’s big rocks',
      subtitle: 'Habit 3 — put first things first',
      field: 'big_rocks_set',
      icon: Mountain,
      tone: 'var(--q2)',
      content: () => {
        const bigRocks = activeTasks.filter(t => t.is_big_rock);
        return (
          <div>
            <Stat value={bigRocks.length} label="big rocks set" tone="var(--q2)" />
            <div className="space-y-1.5 mt-3">
              {bigRocks.map(t => (
                <div key={t.id} className="glass-soft px-3 py-2">
                  <p className="text-sm" style={{ color: 'var(--text)' }}>{t.title}</p>
                </div>
              ))}
            </div>
            <StepLink href="/tasks">Set big rocks</StepLink>
          </div>
        );
      },
    },
    {
      title: 'Reflect and celebrate',
      subtitle: 'Acknowledge the wins, then set the tone for next week',
      field: null,
      icon: Sparkles,
      tone: 'var(--q3)',
      content: () => (
        <div className="space-y-4">
          <Field
            label={`Wins this week — ${completedThisWeek.length} tasks completed`}
            placeholder="What went well?"
            rows={3}
            value={review?.wins || ''}
            onChange={v => updateReview({ wins: v })}
          />
          <Field
            label="What to improve"
            placeholder="What could be better?"
            rows={3}
            value={review?.improvements || ''}
            onChange={v => updateReview({ improvements: v })}
          />
          <Field
            label="Gratitude"
            placeholder="What are you grateful for?"
            rows={2}
            value={review?.gratitude || ''}
            onChange={v => updateReview({ gratitude: v })}
          />
          <button
            onClick={() => updateReview({ completed_at: new Date().toISOString() })}
            className="btn btn-primary w-full py-3 text-base flex items-center justify-center gap-2"
          >
            <Sparkles size={18} /> Complete weekly review
          </button>
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="max-w-3xl" style={{ position: 'relative' }}>
        <Aurora />
        <div style={{ position: 'relative', zIndex: 1 }} className="space-y-4">
          <div className="glass" style={{ height: 118 }} />
          <div className="glass" style={{ height: 150 }} />
          <div className="glass" style={{ height: 300 }} />
        </div>
      </div>
    );
  }

  const currentStep = steps[step];
  const StepIcon = currentStep.icon;
  const trackable = steps.filter(s => s.field);
  const doneCount = trackable.filter(s => review?.[s.field]).length;
  const pct = Math.round((doneCount / trackable.length) * 100);
  const isDone = (i) => steps[i].field && review?.[steps[i].field];
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });

  return (
    <div className="max-w-3xl animate-in" style={{ position: 'relative' }}>
      <Aurora />
      <div style={{ position: 'relative', zIndex: 1 }}>

        {/* Hero */}
        <div className="glass p-5 mb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--text)', letterSpacing: '-0.02em' }}>
                <ClipboardCheck size={22} style={{ color: 'var(--accent)' }} />
                Weekly Review
              </h1>
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                {format(weekStart, 'MMM d')} – {format(endOfWeek(weekStart, { weekStartsOn: 1 }), 'MMM d, yyyy')}
              </p>
            </div>
            <ProgressRing pct={pct} done={doneCount} total={trackable.length} complete={!!review?.completed_at} />
          </div>
          {review?.completed_at && (
            <div className="flex items-center gap-2 mt-4 px-3 py-2 rounded-xl"
              style={{ background: 'color-mix(in srgb, var(--q2) 14%, transparent)', color: 'var(--q2)' }}>
              <CheckCircle2 size={15} />
              <span className="text-sm font-medium">Review completed for this week</span>
            </div>
          )}
        </div>

        {/* Q2 focus */}
        <div className="glass p-5 mb-4" style={{ borderLeft: '3px solid var(--q2)' }}>
          <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--q2)' }}>
            <Mountain size={15} /> This week’s Q2 focus
          </h3>
          <p className="text-xs mt-1 mb-3" style={{ color: 'var(--text-muted)' }}>
            The 2–3 important-but-not-urgent priorities you will protect. Keep them short.
          </p>
          <textarea
            className="input w-full"
            rows={3}
            placeholder={'1.\n2.\n3.'}
            value={review?.notes || ''}
            onChange={e => updateReview({ notes: e.target.value })}
          />
        </div>

        {/* Stepper */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {steps.map((s, i) => {
            const done = isDone(i);
            const active = i === step;
            return (
              <button
                key={i}
                onClick={() => setStep(i)}
                title={s.title}
                className="shrink-0 flex items-center justify-center rounded-full text-xs font-semibold transition-all"
                style={{
                  width: 34, height: 34,
                  background: active ? 'var(--accent)' : done ? 'color-mix(in srgb, var(--q2) 18%, transparent)' : 'var(--bg-card)',
                  color: active ? '#fff' : done ? 'var(--q2)' : 'var(--text-muted)',
                  border: `1px solid ${active ? 'var(--accent)' : done ? 'color-mix(in srgb, var(--q2) 35%, transparent)' : 'var(--border)'}`,
                  boxShadow: active ? '0 4px 14px color-mix(in srgb, var(--accent) 45%, transparent)' : 'none',
                }}
              >
                {done && !active ? <Check size={15} /> : i + 1}
              </button>
            );
          })}
        </div>

        {/* Current step */}
        <div className="glass p-5">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: `color-mix(in srgb, ${currentStep.tone} 16%, transparent)` }}>
              <StepIcon size={19} style={{ color: currentStep.tone }} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold" style={{ color: 'var(--text)', letterSpacing: '-0.01em' }}>{currentStep.title}</h2>
                {isDone(step) && <Check size={15} style={{ color: 'var(--q2)' }} />}
              </div>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{currentStep.subtitle}</p>
            </div>
          </div>

          {currentStep.content()}

          <div className="flex items-center justify-between mt-6 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
            <button
              onClick={() => setStep(Math.max(0, step - 1))}
              className="btn btn-ghost flex items-center gap-1"
              disabled={step === 0}
              style={{ opacity: step === 0 ? 0.4 : 1 }}
            >
              <ChevronLeft size={16} /> Previous
            </button>

            {currentStep.field && (
              <button
                onClick={() => {
                  updateReview({ [currentStep.field]: true });
                  setStep(Math.min(steps.length - 1, step + 1));
                }}
                className="btn btn-primary flex items-center gap-1.5"
              >
                {isDone(step) ? 'Next' : 'Mark done'} <ChevronRight size={16} />
              </button>
            )}

            {!currentStep.field && step < steps.length - 1 && (
              <button onClick={() => setStep(step + 1)} className="btn btn-primary flex items-center gap-1.5">
                Next <ChevronRight size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── small pieces ─────────────────────────────────────────────

function ProgressRing({ pct, done, total, complete }) {
  const r = 26, C = 2 * Math.PI * r;
  const tone = complete ? 'var(--q2)' : 'var(--accent)';
  return (
    <div className="relative shrink-0" style={{ width: 64, height: 64 }}>
      <svg width="64" height="64" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r={r} fill="none" stroke="var(--border)" strokeWidth="6" />
        <circle
          cx="32" cy="32" r={r} fill="none" stroke={tone} strokeWidth="6" strokeLinecap="round"
          strokeDasharray={C} strokeDashoffset={C * (1 - pct / 100)}
          transform="rotate(-90 32 32)" style={{ transition: 'stroke-dashoffset .45s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-sm font-bold leading-none" style={{ color: 'var(--text)' }}>{done}</span>
        <span className="text-[10px] leading-none mt-0.5" style={{ color: 'var(--text-muted)' }}>of {total}</span>
      </div>
    </div>
  );
}

function Stat({ value, label, tone = 'var(--text)' }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="text-3xl font-bold tabular-nums" style={{ color: tone, letterSpacing: '-0.02em' }}>{value}</span>
      <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{label}</span>
    </div>
  );
}

function StepLink({ href, children }) {
  return (
    <Link href={href} className="inline-flex items-center gap-1.5 text-sm font-medium mt-3" style={{ color: 'var(--accent)' }}>
      {children} <ArrowRight size={14} />
    </Link>
  );
}

function Field({ label, placeholder, rows, value, onChange }) {
  return (
    <div>
      <p className="text-sm font-medium mb-1.5" style={{ color: 'var(--text)' }}>{label}</p>
      <textarea
        className="input w-full"
        rows={rows}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  );
}

export default function Page() {
  return <AppShell><WeeklyReviewPage /></AppShell>;
}
