'use client';

import AppShell from '@/components/AppShell';
import HealthNav from '@/components/HealthNav';
import { useHealthLogs, upsertHealthLog } from '@/lib/hooks';
import { useBiomarkers, upsertBiomarkers } from '@/lib/health-hooks';
import {
  MARKERS, HABITS, METRICS, NUTRITION, WEEK, DAILY_GOAL, MACROS,
  todayISO, addDays, dayIndex, parseISO,
  markerStatus, targetText, trendOf, dayScore, countHabits, autoHabits,
  macroTotal, dinnerContribution,
} from '@/lib/health-tracker-data';
import {
  ClipboardCheck, ChevronLeft, ChevronRight, Loader2, Upload, Pencil, Check,
  UtensilsCrossed, ChevronDown, ChevronUp, Flame, Target,
} from 'lucide-react';
import { useMemo, useRef, useState } from 'react';

const CHRONO_AGE_KEY = 'fh-tracker-chrono-age';
const TABS = ['Today', 'Plan', 'Markers', 'Trends'];

export default function TrackerPage() {
  return (
    <AppShell>
      <TrackerContent />
    </AppShell>
  );
}

function TrackerContent() {
  const [tab, setTab] = useState('Today');

  return (
    <div className="max-w-4xl animate-in">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--accent)', opacity: 0.9 }}>
          <ClipboardCheck size={22} color="white" />
        </div>
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>Function Protocol Tracker</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Daily adherence against your biomarker targets</p>
        </div>
      </div>

      <HealthNav />

      <div className="flex gap-1 mb-6" style={{ borderBottom: '1px solid var(--border)' }}>
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-4 py-2 text-sm font-medium transition-colors"
            style={{
              color: tab === t ? 'var(--accent)' : 'var(--text-muted)',
              borderBottom: tab === t ? '2px solid var(--accent)' : '2px solid transparent',
              marginBottom: -1,
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Today' && <TodayTab />}
      {tab === 'Plan' && <ProtocolTab />}
      {tab === 'Markers' && <MarkersTab />}
      {tab === 'Trends' && <TrendsTab />}
    </div>
  );
}

// ─── shared bits ────────────────────────────────────────────────

function useChronoAge() {
  const [age, setAgeState] = useState(() => {
    if (typeof window === 'undefined') return '';
    return window.localStorage.getItem(CHRONO_AGE_KEY) || '';
  });
  const setAge = (v) => {
    setAgeState(v);
    if (typeof window !== 'undefined') window.localStorage.setItem(CHRONO_AGE_KEY, v);
  };
  return [age, setAge];
}

function Recipe({ meal }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 10 }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1 text-sm font-medium"
        style={{ color: 'var(--accent)' }}
      >
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        Ingredients &amp; method
      </button>
      {open && (
        <div className="mt-2">
          <div className="flex flex-wrap gap-1.5 mb-3">
            {meal.ing.map(i => (
              <span key={i} className="text-xs px-2 py-1 rounded-md" style={{ background: 'var(--surface)', color: 'var(--text-secondary)' }}>{i}</span>
            ))}
          </div>
          <ol className="text-sm space-y-2 pl-4" style={{ color: 'var(--text-secondary)' }}>
            {meal.steps.map(([title, body]) => (
              <li key={title} style={{ listStyle: 'decimal' }}>
                <b style={{ color: 'var(--text)', display: 'block' }}>{title}</b>
                {body}
              </li>
            ))}
          </ol>
          <div className="text-xs mt-3 p-2.5 rounded-lg" style={{ background: 'var(--surface)', color: 'var(--text-muted)', borderLeft: '2px solid var(--accent)' }}>
            {meal.labs}
          </div>
        </div>
      )}
    </div>
  );
}

function MealCard({ meal, highlight, showDay }) {
  return (
    <div className="card" style={highlight ? { borderColor: 'var(--accent)' } : undefined}>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
          {showDay ? meal.day : `${meal.day}'s dinner`}
        </h2>
        {highlight && (
          <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: 'var(--accent-bg)', color: 'var(--accent)' }}>Tonight</span>
        )}
      </div>
      <p className="text-lg font-semibold mt-2" style={{ color: 'var(--text)' }}>{meal.name}</p>
      <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{meal.benefit}</p>
      <div className="flex gap-4 flex-wrap mt-3">
        <Macro label="kcal" value={meal.kcal} />
        <Macro label="protein" value={`${meal.p} g`} />
        <Macro label="fat" value={`${meal.f} g`} />
        <Macro label="carbs" value={`${meal.c} g`} />
      </div>
      <Recipe meal={meal} />
    </div>
  );
}

// One-line dinner row for the Today tab — expands to the full card on tap.
function MealRow({ meal }) {
  const [open, setOpen] = useState(false);
  if (open) {
    return (
      <div>
        <MealCard meal={meal} />
        <button
          onClick={() => setOpen(false)}
          className="text-xs font-medium mt-1 px-1"
          style={{ color: 'var(--text-muted)' }}
        >
          Collapse
        </button>
      </div>
    );
  }
  return (
    <button
      onClick={() => setOpen(true)}
      className="card w-full flex items-center gap-3 text-left"
      style={{ padding: '12px 16px' }}
    >
      <UtensilsCrossed size={16} className="shrink-0" style={{ color: 'var(--text-muted)' }} />
      <span className="flex-1 min-w-0">
        <span className="text-sm font-medium block truncate" style={{ color: 'var(--text)' }}>{meal.name}</span>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Tonight&apos;s dinner · {meal.kcal} kcal · {meal.p} g protein</span>
      </span>
      <ChevronDown size={16} className="shrink-0" style={{ color: 'var(--text-muted)' }} />
    </button>
  );
}

function Macro({ label, value }) {
  return (
    <div>
      <div className="text-base font-semibold" style={{ color: 'var(--text)' }}>{value}</div>
      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</div>
    </div>
  );
}

// One-line habit row. Hint and biomarker tags stay behind the chevron so
// the daily checklist reads as a list, not a lesson.
function HabitRow({ habit, on, onToggle }) {
  const [open, setOpen] = useState(false);
  const hasDetails = habit.hint || habit.targets.length > 0;
  return (
    <div className="rounded-lg" style={{ background: on ? 'var(--accent-bg)' : 'transparent' }}>
      <div className="flex items-center gap-3 py-2 px-2">
        <input
          type="checkbox" checked={on} onChange={onToggle}
          className="shrink-0" style={{ accentColor: 'var(--accent)', width: 18, height: 18 }}
        />
        <button onClick={onToggle} className="flex-1 min-w-0 text-left text-sm" style={{ color: 'var(--text)', fontWeight: on ? 500 : 400 }}>
          {habit.label}
        </button>
        {hasDetails && (
          <button onClick={() => setOpen(o => !o)} className="shrink-0 p-1" style={{ color: 'var(--text-muted)' }} aria-label="Details">
            {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        )}
      </div>
      {open && (
        <div className="px-9 pb-2">
          {habit.hint && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{habit.hint}</p>}
          <div className="flex flex-wrap gap-1 mt-1">
            {habit.targets.map(t => (
              <span key={t} className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'var(--surface)', color: 'var(--text-muted)' }}>
                {MARKERS.find(m => m.id === t)?.name || t}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Today ──────────────────────────────────────────────────────

function TodayTab() {
  const [cursor, setCursor] = useState(todayISO());
  const { data: logs, loading } = useHealthLogs(120);

  const log = useMemo(() => logs.find(l => l.date === cursor) || null, [logs, cursor]);
  const meal = WEEK[dayIndex(cursor)];
  const label = cursor === todayISO() ? 'Today'
    : cursor === addDays(todayISO(), -1) ? 'Yesterday'
    : parseISO(cursor).toLocaleDateString(undefined, { weekday: 'long' });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <button
          className="w-9 h-9 rounded-lg flex items-center justify-center"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text)' }}
          onClick={() => setCursor(c => addDays(c, -1))}
        >
          <ChevronLeft size={16} />
        </button>
        <div className="text-center">
          <div className="font-semibold" style={{ color: 'var(--text)' }}>{label}</div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {parseISO(cursor).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
        </div>
        <button
          className="w-9 h-9 rounded-lg flex items-center justify-center disabled:opacity-30"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text)' }}
          onClick={() => setCursor(c => addDays(c, 1))}
          disabled={cursor >= todayISO()}
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="animate-spin" style={{ color: 'var(--accent)' }} />
        </div>
      ) : (
        <DayEditor key={cursor} date={cursor} log={log} meal={meal} />
      )}
    </div>
  );
}

function DayEditor({ date, log, meal }) {
  const [habits, setHabits] = useState(() => log?.habits || []);
  const [metrics, setMetrics] = useState(() => log?.metrics || {});
  const [note, setNote] = useState(() => log?.note || '');
  const [bp, setBp] = useState(() => ({ sys: log?.bp_systolic || '', dia: log?.bp_diastolic || '' }));
  const [saving, setSaving] = useState(false);

  const persist = async (next) => {
    setSaving(true);
    try {
      const b = next.bp ?? bp;
      await upsertHealthLog({
        date,
        habits: next.habits ?? habits,
        metrics: next.metrics ?? metrics,
        note: next.note ?? note,
        bp_systolic: b.sys ? parseInt(b.sys, 10) : null,
        bp_diastolic: b.dia ? parseInt(b.dia, 10) : null,
      });
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const toggleHabit = (id) => {
    const next = habits.includes(id) ? habits.filter(h => h !== id) : [...habits, id];
    setHabits(next);
    persist({ habits: next });
  };

  const setMetric = (id, value) => setMetrics(m => ({ ...m, [id]: value }));
  const saveMetrics = () => {
    const synced = autoHabits(metrics, habits, date);
    if (synced !== habits) setHabits(synced);
    persist({ metrics, habits: synced });
  };
  const saveNote = () => persist({ note });

  const done = countHabits(habits);
  const goalHit = done >= DAILY_GOAL;
  const groups = [...new Set(HABITS.map(h => h.grp))];

  return (
    <div className="space-y-4">
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
            <Target size={14} /> Daily goal
          </h2>
          <span className="text-xs font-medium" style={{ color: goalHit ? 'var(--success)' : 'var(--text-muted)' }}>
            {goalHit ? 'Complete' : `${Math.round((done / DAILY_GOAL) * 100)}%`}
          </span>
        </div>

        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-4xl font-bold tabular-nums"
            style={{ color: goalHit ? 'var(--success)' : 'var(--text)', letterSpacing: '-0.03em', transition: 'color .3s' }}>
            {done}
          </span>
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>/ {DAILY_GOAL} habits</span>
          <span className="text-xs ml-auto text-right" style={{ color: goalHit ? 'var(--success)' : 'var(--text-muted)' }}>
            {goalHit
              ? (done > DAILY_GOAL ? `Goal hit · +${done - DAILY_GOAL} bonus` : 'Goal hit')
              : `${DAILY_GOAL - done} to go`}
          </span>
        </div>

        <div className="flex gap-1.5">
          {Array.from({ length: DAILY_GOAL }, (_, i) => {
            const filled = i < Math.min(done, DAILY_GOAL);
            return (
              <span
                key={i}
                className="flex-1 rounded-full"
                style={{
                  height: 8,
                  background: filled
                    ? (goalHit
                        ? 'linear-gradient(180deg, color-mix(in srgb, var(--success) 82%, white), var(--success))'
                        : 'linear-gradient(180deg, var(--accent-light), var(--accent))')
                    : 'var(--surface)',
                  boxShadow: filled ? '0 1px 5px color-mix(in srgb, var(--accent) 34%, transparent)' : 'none',
                  transition: 'background .3s, box-shadow .3s',
                }}
              />
            );
          })}
        </div>
      </div>

      <div className="card">
        <div className="space-y-4">
          {groups.map(g => (
            <div key={g}>
              <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--text-muted)' }}>{g}</p>
              <div>
                {HABITS.filter(h => h.grp === g).map(h => (
                  <HabitRow key={h.id} habit={h} on={habits.includes(h.id)} onToggle={() => toggleHabit(h.id)} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <FuelCard metrics={metrics} habits={habits} date={date} />

      <div className="card">
        <h2 className="text-sm font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--text-muted)' }}>Daily metrics</h2>
        <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(102px, 1fr))' }}>
          {METRICS.map(m => (
            <div key={m.id} className="rounded-xl px-3 py-2" style={{ background: 'var(--surface)' }}>
              <label className="text-xs block mb-0.5" style={{ color: 'var(--text-muted)' }}>{m.label}{m.unit && ` (${m.unit})`}</label>
              <input
                type="number" inputMode="decimal" step={m.step} placeholder="—"
                value={metrics[m.id] ?? ''}
                onChange={e => setMetric(m.id, e.target.value)}
                onBlur={saveMetrics}
                className="w-full bg-transparent outline-none font-semibold"
                style={{ color: 'var(--text)' }}
              />
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 mt-2 rounded-xl px-3 py-2" style={{ background: 'var(--surface)' }}>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Blood pressure</span>
          <input
            type="number" inputMode="numeric" placeholder="sys" value={bp.sys}
            onChange={e => setBp(b => ({ ...b, sys: e.target.value }))}
            onBlur={() => persist({ bp })}
            className="w-14 bg-transparent outline-none font-semibold text-right"
            style={{ color: 'var(--text)' }}
          />
          <span style={{ color: 'var(--text-muted)' }}>/</span>
          <input
            type="number" inputMode="numeric" placeholder="dia" value={bp.dia}
            onChange={e => setBp(b => ({ ...b, dia: e.target.value }))}
            onBlur={() => persist({ bp })}
            className="w-14 bg-transparent outline-none font-semibold"
            style={{ color: 'var(--text)' }}
          />
          {bp.sys && (
            <span className="text-xs ml-auto font-medium" style={{ color: bp.sys < 120 ? 'var(--success)' : bp.sys < 130 ? 'var(--warning)' : 'var(--danger)' }}>
              {bp.sys < 120 ? 'Normal' : bp.sys < 130 ? 'Elevated' : 'High'}
            </span>
          )}
        </div>
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          onBlur={saveNote}
          placeholder="Notes — symptoms, energy, deviations…"
          className="w-full mt-3 rounded-xl p-3 text-sm outline-none"
          style={{ background: 'var(--surface)', color: 'var(--text)', minHeight: 64, resize: 'vertical' }}
        />
        {saving && <div className="text-xs mt-1 flex items-center gap-1" style={{ color: 'var(--text-muted)' }}><Loader2 size={11} className="animate-spin" /> Saving…</div>}
      </div>

      <MealRow meal={meal} />
    </div>
  );
}

// ─── Fuel ───────────────────────────────────────────────────────

// One macro's progress. Two segments: what was logged by hand, and what the
// protocol dinner contributed, so the automatic part is always visible rather
// than silently inflating the number.
function MacroBar({ macro, metrics, habits, date, hero }) {
  const { logged, fromMeal, total } = macroTotal(macro, metrics, habits, date);
  const target = macro.target || 1;
  const over = total > target;
  const loggedPct = Math.max(0, Math.min(100, (logged / target) * 100));
  const mealPct = Math.max(0, Math.min(100 - loggedPct, (fromMeal / target) * 100));
  const tone = over ? 'var(--warning)' : macro.tone;
  const h = hero ? 10 : 7;

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 mb-1">
        <span className={hero ? 'text-sm font-medium' : 'text-xs'} style={{ color: hero ? 'var(--text)' : 'var(--text-secondary)' }}>
          {macro.label}
        </span>
        <span className="text-xs tabular-nums shrink-0" style={{ color: over ? 'var(--warning)' : 'var(--text-muted)' }}>
          <b style={{ color: over ? 'var(--warning)' : 'var(--text)' }}>{Math.round(total).toLocaleString()}</b>
          {' / '}{target.toLocaleString()} {macro.unit}
        </span>
      </div>
      <div style={{ height: h, borderRadius: h, background: 'var(--surface)', overflow: 'hidden', display: 'flex' }}>
        <span style={{ width: `${loggedPct}%`, background: tone, transition: 'width .35s ease' }} />
        <span style={{ width: `${mealPct}%`, background: tone, opacity: 0.42, transition: 'width .35s ease' }} />
      </div>
    </div>
  );
}

function FuelCard({ metrics, habits, date }) {
  const [calories, ...rest] = MACROS;
  const cal = macroTotal(calories, metrics, habits, date);
  const meal = dinnerContribution(habits, date);
  const pct = Math.round((cal.total / calories.target) * 100);
  const over = cal.total > calories.target;
  const remaining = calories.target - cal.total;

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
          <Flame size={14} /> Fuel
        </h2>
        <span className="text-xs font-medium tabular-nums" style={{ color: over ? 'var(--warning)' : 'var(--text-muted)' }}>
          {pct}% of target
        </span>
      </div>

      <div className="flex items-baseline gap-2 mb-2">
        <span className="text-4xl font-bold tabular-nums" style={{ color: 'var(--text)', letterSpacing: '-0.03em' }}>
          {Math.round(cal.total).toLocaleString()}
        </span>
        <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
          / {calories.target.toLocaleString()} kcal
        </span>
        <span className="text-xs ml-auto" style={{ color: over ? 'var(--warning)' : 'var(--text-muted)' }}>
          {over ? `${Math.abs(Math.round(remaining)).toLocaleString()} over` : `${Math.round(remaining).toLocaleString()} left`}
        </span>
      </div>

      <div style={{ height: 10, borderRadius: 10, background: 'var(--surface)', overflow: 'hidden', display: 'flex' }}>
        <span style={{
          width: `${Math.max(0, Math.min(100, (cal.logged / calories.target) * 100))}%`,
          background: over ? 'var(--warning)' : calories.tone, transition: 'width .35s ease',
        }} />
        <span style={{
          width: `${Math.max(0, Math.min(100 - (cal.logged / calories.target) * 100, (cal.fromMeal / calories.target) * 100))}%`,
          background: over ? 'var(--warning)' : calories.tone, opacity: 0.42, transition: 'width .35s ease',
        }} />
      </div>

      <div className="space-y-2.5 mt-4">
        {rest.map(m => (
          <MacroBar key={m.id} macro={m} metrics={metrics} habits={habits} date={date} />
        ))}
      </div>

      <p className="text-xs mt-3 pt-3" style={{ color: 'var(--text-muted)', borderTop: '1px solid var(--border)' }}>
        {meal
          ? <>The lighter part of each bar is tonight&rsquo;s protocol dinner ({meal.kcal} kcal), counted automatically. Log everything else below.</>
          : <>Log what you ate below. Ticking tonight&rsquo;s protocol dinner adds its macros for you.</>}
      </p>
    </div>
  );
}

// ─── Protocol ───────────────────────────────────────────────────

function ProtocolTab() {
  const todayIdx = dayIndex(todayISO());
  return (
    <div className="space-y-4">
      <div className="card">
        <h2 className="text-sm font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--text-muted)' }}>Daily nutrition targets</h2>
        <div className="flex gap-5 flex-wrap">
          <Macro label="kcal" value={NUTRITION.calories} />
          <Macro label="protein" value={`${NUTRITION.protein} g`} />
          <Macro label="fat" value={`${NUTRITION.fats} g`} />
          <Macro label="carbs" value={`${NUTRITION.carbs} g`} />
        </div>
        <div className="mt-3 space-y-1">
          {NUTRITION.objectives.map(o => (
            <p key={o} className="text-sm" style={{ color: 'var(--text-secondary)' }}>• {o}</p>
          ))}
        </div>
      </div>

      <div className="card">
        <h2 className="text-sm font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--text-muted)' }}>Lifestyle rules</h2>
        <div className="space-y-1">
          {NUTRITION.lifestyle.map(o => (
            <p key={o} className="text-sm" style={{ color: 'var(--text-secondary)' }}>• {o}</p>
          ))}
        </div>
      </div>

      <h2 className="text-sm font-semibold uppercase tracking-wide flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
        <UtensilsCrossed size={14} /> The week of dinners
      </h2>
      <div className="space-y-3">
        {WEEK.map((meal, i) => (
          <MealCard key={meal.day} meal={meal} highlight={i === todayIdx} showDay />
        ))}
      </div>
    </div>
  );
}

// ─── Markers ────────────────────────────────────────────────────

function groupByMarker(rows) {
  const byId = {};
  for (const r of rows) {
    (byId[r.marker_id] ||= []).push({ d: r.date, v: Number(r.value) });
  }
  for (const id in byId) byId[id].sort((a, b) => (a.d < b.d ? -1 : a.d > b.d ? 1 : 0));
  return byId;
}

function Sparkline({ history, m, chronoAge }) {
  if (!history || history.length < 2) return null;
  const vals = history.map(p => p.v);
  const lo = Math.min(...vals), hi = Math.max(...vals), span = (hi - lo) || 1;
  const W = 56, H = 18;
  const pts = vals.map((v, i) => `${((i / (vals.length - 1)) * W).toFixed(1)},${(H - ((v - lo) / span) * H).toFixed(1)}`).join(' ');
  const tr = trendOf(m, vals[vals.length - 2], vals[vals.length - 1], chronoAge);
  const col = tr === 'better' ? 'var(--success)' : tr === 'worse' ? 'var(--danger)' : 'var(--text-muted)';
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="shrink-0">
      <polyline points={pts} fill="none" stroke={col} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DeltaChip({ history, m, chronoAge }) {
  if (!history || history.length < 2) return null;
  const prev = history[history.length - 2].v, last = history[history.length - 1].v;
  const d = last - prev;
  if (Math.abs(d) < 1e-9) return <span className="text-[11px] px-1.5 py-0.5 rounded" style={{ background: 'var(--surface)', color: 'var(--text-muted)' }}>no change</span>;
  const tr = trendOf(m, prev, last, chronoAge);
  const color = tr === 'better' ? 'var(--success)' : tr === 'worse' ? 'var(--danger)' : 'var(--text-muted)';
  const rounded = Math.abs(d) < 10 ? d.toFixed(1) : Math.round(d);
  return <span className="text-[11px] px-1.5 py-0.5 rounded" style={{ background: 'var(--surface)', color }}>{d > 0 ? '+' : ''}{rounded} vs last</span>;
}

function TargetBar({ m, value, status, chronoAge }) {
  if (status === 'none' || !m.scale) return null;
  const [lo, hi] = m.scale;
  const at = (x) => Math.max(0, Math.min(100, ((x - lo) / (hi - lo)) * 100));
  const b = m.id === 'bioage' ? { min: null, max: chronoAge || null } : { min: m.min ?? null, max: m.max ?? null };
  const zFrom = at(b.min != null ? b.min : lo);
  const zTo = at(b.max != null ? b.max : hi);
  const pos = at(Number(value));
  return (
    <div style={{ height: 6, borderRadius: 3, background: 'var(--surface)', position: 'relative', marginTop: 11 }}>
      <span style={{ position: 'absolute', top: 0, bottom: 0, left: `${zFrom}%`, width: `${zTo - zFrom}%`, borderRadius: 3, background: 'color-mix(in srgb, var(--success) 32%, transparent)' }} />
      <span style={{
        position: 'absolute', top: -3, left: `${pos}%`, width: 12, height: 12, marginLeft: -6, borderRadius: '50%',
        background: status === 'in_range' ? 'var(--success)' : 'var(--danger)', border: '2px solid var(--bg-card)', boxShadow: '0 0 0 1px var(--border)',
      }} />
    </div>
  );
}

function MarkerRow({ m, history, chronoAge, editing, onSave }) {
  const current = history && history.length ? history[history.length - 1] : null;
  const status = markerStatus(m, current?.v, chronoAge);
  const [val, setVal] = useState(current?.v ?? '');
  const [date, setDate] = useState(current?.d ?? todayISO());
  const drivers = HABITS.filter(h => h.targets.includes(m.id));

  return (
    <div className="py-3" style={{ borderTop: '1px solid var(--border)' }}>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>{m.name}</span>
        <span className="text-lg font-semibold whitespace-nowrap" style={{ color: status === 'in_range' ? 'var(--success)' : status === 'none' ? 'var(--text-muted)' : 'var(--danger)' }}>
          {status === 'none' ? '—' : <>{current.v} <span className="text-xs font-normal" style={{ color: 'var(--text-muted)' }}>{m.unit}</span></>}
        </span>
      </div>
      <div className="flex items-center justify-between gap-3 mt-0.5">
        <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{targetText(m)}</span>
        <span className="flex items-center gap-1.5">
          <DeltaChip history={history} m={m} chronoAge={chronoAge} />
          <Sparkline history={history} m={m} chronoAge={chronoAge} />
        </span>
      </div>
      <TargetBar m={m} value={current?.v} status={status} chronoAge={chronoAge} />
      {drivers.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {drivers.map(h => <span key={h.id} className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'var(--surface)', color: 'var(--text-muted)' }}>{h.label}</span>)}
        </div>
      )}
      {editing && (
        <div className="flex gap-2 mt-2">
          <input
            type="number" step="any" placeholder="value" value={val}
            onChange={e => setVal(e.target.value)}
            onBlur={() => val !== '' && onSave(m.id, val, date)}
            className="flex-1 rounded-lg px-2.5 py-1.5 text-sm outline-none"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
          />
          <input
            type="date" value={date}
            onChange={e => { setDate(e.target.value); if (val !== '') onSave(m.id, val, e.target.value); }}
            className="rounded-lg px-2.5 py-1.5 text-sm outline-none"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', flex: '0 0 140px' }}
          />
        </div>
      )}
    </div>
  );
}

function MarkersTab() {
  const { data: rows, loading } = useBiomarkers();
  const [chronoAge, setChronoAge] = useChronoAge();
  const [editing, setEditing] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef(null);

  const byMarker = useMemo(() => groupByMarker(rows), [rows]);
  const groups = [...new Set(MARKERS.map(m => m.g))];

  const loadedIds = MARKERS.filter(m => byMarker[m.id]?.length).map(m => m.id);
  const offCount = loadedIds.filter(id => {
    const m = MARKERS.find(x => x.id === id);
    const h = byMarker[id];
    return markerStatus(m, h[h.length - 1].v, chronoAge) !== 'in_range';
  }).length;
  const latestDate = loadedIds.length
    ? loadedIds.map(id => byMarker[id][byMarker[id].length - 1].d).sort().pop()
    : null;

  const saveOne = async (marker_id, value, date) => {
    try {
      await upsertBiomarkers([{ marker_id, value: Number(value), date }]);
    } catch (e) {
      console.error(e);
    }
  };

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImporting(true);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (!parsed.markers) throw new Error('no markers key in file');
      const out = [];
      for (const [id, rec] of Object.entries(parsed.markers)) {
        if (rec.value != null && rec.value !== '' && rec.date) out.push({ marker_id: id, value: Number(rec.value), date: rec.date });
        for (const h of rec.history || []) {
          if (h.d && h.v != null) out.push({ marker_id: id, value: Number(h.v), date: h.d });
        }
      }
      if (out.length) await upsertBiomarkers(out);
      if (parsed.settings?.chronoAge) setChronoAge(String(parsed.settings.chronoAge));
    } catch (err) {
      alert('Could not read that file: ' + err.message);
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <div className="card">
        <h2 className="text-sm font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>Your results</h2>
        {loading ? (
          <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}><Loader2 size={14} className="animate-spin" /> Loading…</div>
        ) : loadedIds.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No results loaded yet. Import a results file, or enter values manually below.</p>
        ) : (
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {loadedIds.length} markers loaded · <b style={{ color: 'var(--text)' }}>{offCount} outside target</b>{latestDate && ` · drawn ${latestDate}`}
          </p>
        )}
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <button
            onClick={() => fileRef.current?.click()}
            disabled={importing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-white"
            style={{ background: 'var(--accent)', opacity: importing ? 0.6 : 1 }}
          >
            {importing ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            Import results file
          </button>
          <button
            onClick={() => setEditing(e => !e)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text)' }}
          >
            {editing ? <Check size={14} /> : <Pencil size={14} />}
            {editing ? 'Done editing' : 'Enter manually'}
          </button>
          <input ref={fileRef} type="file" accept="application/json" hidden onChange={handleFile} />
          <div className="flex items-center gap-1.5 text-sm ml-auto" style={{ color: 'var(--text-muted)' }}>
            Chronological age
            <input
              type="number" step="0.1" value={chronoAge} onChange={e => setChronoAge(e.target.value)}
              className="w-16 rounded-lg px-2 py-1 text-sm outline-none"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
            />
          </div>
        </div>
      </div>

      {groups.map(g => (
        <div key={g} className="card">
          <h2 className="text-sm font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{g}</h2>
          {MARKERS.filter(m => m.g === g).map(m => (
            <MarkerRow key={m.id} m={m} history={byMarker[m.id]} chronoAge={chronoAge} editing={editing} onSave={saveOne} />
          ))}
        </div>
      ))}
    </div>
  );
}

// Blood-pressure trend, moved here from the Wellbeing page — the tracker
// owns body metrics now. Last 30 readings, systolic and diastolic.
function BPTrendCard({ logs }) {
  const readings = logs
    .filter(l => l.bp_systolic && l.bp_diastolic)
    .slice(0, 30)
    .sort((a, b) => (a.date < b.date ? -1 : 1));
  if (readings.length === 0) return null;
  const latest = readings[readings.length - 1];
  const all = readings.flatMap(l => [l.bp_systolic, l.bp_diastolic]);
  const lo = Math.min(...all) - 5, hi = Math.max(...all) + 5, span = hi - lo;
  const W = 100, H = 36;
  const line = (get) => readings.map((l, i) =>
    `${(readings.length === 1 ? W / 2 : (i / (readings.length - 1)) * W).toFixed(1)},${(H - ((get(l) - lo) / span) * H).toFixed(1)}`
  ).join(' ');
  const sysColor = latest.bp_systolic < 120 ? 'var(--success)' : latest.bp_systolic < 130 ? 'var(--warning)' : 'var(--danger)';
  return (
    <div className="card">
      <div className="flex items-baseline justify-between mb-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Blood pressure</h2>
        <span className="text-sm">
          <b className="text-lg" style={{ color: sysColor }}>{latest.bp_systolic}/{latest.bp_diastolic}</b>
          <span className="text-xs ml-1.5" style={{ color: 'var(--text-muted)' }}>{latest.date}</span>
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 72 }} preserveAspectRatio="none">
        <polyline points={line(l => l.bp_systolic)} fill="none" stroke={sysColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        <polyline points={line(l => l.bp_diastolic)} fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" vectorEffect="non-scaling-stroke" />
      </svg>
      <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Last {readings.length} readings · log BP on the Today tab</p>
    </div>
  );
}

// ─── Trends ─────────────────────────────────────────────────────

function TrendsTab() {
  const { data: logs, loading } = useHealthLogs(120);
  const byDate = useMemo(() => {
    const m = {};
    for (const l of logs) m[l.date] = l;
    return m;
  }, [logs]);

  const t = todayISO();

  const heatCells = useMemo(() => {
    let start = addDays(t, -55);
    start = addDays(start, -dayIndex(start));
    const cells = [];
    for (let i = 0; i < 63; i++) {
      const date = addDays(start, i);
      cells.push({ date, future: date > t, score: dayScore(byDate[date]?.habits) });
    }
    return cells;
  }, [byDate, t]);

  const rolling = [7, 30, 90].map(n => {
    let sum = 0, count = 0, goalDays = 0;
    for (let i = 0; i < n; i++) {
      const date = addDays(t, -i);
      const l = byDate[date];
      if (l && (l.habits?.length || l.note || Object.keys(l.metrics || {}).length)) {
        sum += dayScore(l.habits);
        if (countHabits(l.habits) >= DAILY_GOAL) goalDays++;
        count++;
      }
    }
    return { n, pct: count ? Math.round((sum / count) * 100) : 0, count, goalDays };
  });

  // Consecutive days (ending today or yesterday) with the daily goal hit.
  let goalStreak = 0;
  {
    let cur = countHabits(byDate[t]?.habits) >= DAILY_GOAL ? t : addDays(t, -1);
    while (countHabits(byDate[cur]?.habits) >= DAILY_GOAL) { goalStreak++; cur = addDays(cur, -1); }
  }

  const streaks = HABITS.map(h => {
    let n = 0;
    let cur = byDate[t]?.habits?.includes(h.id) ? t : addDays(t, -1);
    while (byDate[cur]?.habits?.includes(h.id)) { n++; cur = addDays(cur, -1); }
    return { h, n };
  });

  if (loading) {
    return <div className="flex items-center justify-center py-12"><Loader2 size={24} className="animate-spin" style={{ color: 'var(--accent)' }} /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="card">
        <h2 className="text-sm font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--text-muted)' }}>Last 9 weeks</h2>
        <div className="grid gap-1 mb-1" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
            <span key={i} className="text-[10px] text-center" style={{ color: 'var(--text-muted)' }}>{d}</span>
          ))}
        </div>
        <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
          {heatCells.map(c => (
            <div
              key={c.date}
              title={`${c.date} — ${Math.round(c.score * 100)}%`}
              style={{
                aspectRatio: '1', borderRadius: 5,
                opacity: c.future ? 0.25 : 1,
                background: c.score === 0 ? 'var(--surface)' : `color-mix(in srgb, var(--accent) ${Math.round(20 + c.score * 80)}%, transparent)`,
              }}
            />
          ))}
        </div>
        <div className="flex items-center gap-1.5 mt-2.5 text-xs" style={{ color: 'var(--text-muted)' }}>
          Less
          <span style={{ width: 12, height: 12, borderRadius: 3, background: 'var(--surface)' }} />
          <span style={{ width: 12, height: 12, borderRadius: 3, background: 'color-mix(in srgb, var(--accent) 45%, transparent)' }} />
          <span style={{ width: 12, height: 12, borderRadius: 3, background: 'var(--accent)' }} />
          More
        </div>
      </div>

      <div className="card">
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Daily goal · {DAILY_GOAL} habits</h2>
          <span className="text-sm font-semibold" style={{ color: goalStreak > 0 ? 'var(--success)' : 'var(--text-muted)' }}>
            {goalStreak > 0 ? `${goalStreak}-day streak` : 'no streak'}
          </span>
        </div>
        <div className="flex gap-6 flex-wrap">
          {rolling.map(r => (
            <div key={r.n}>
              <div className="text-base font-semibold" style={{ color: 'var(--text)' }}>{r.goalDays}<span className="text-xs font-normal" style={{ color: 'var(--text-muted)' }}> days hit</span></div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>last {r.n} <span className="opacity-70">· avg {r.pct}% of goal</span></div>
            </div>
          ))}
        </div>
      </div>

      <BPTrendCard logs={logs} />

      <div className="card">
        <h2 className="text-sm font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--text-muted)' }}>Current streaks</h2>
        {streaks.map(({ h, n }) => (
          <div key={h.id} className="flex items-center justify-between py-2 text-sm" style={{ borderTop: '1px solid var(--border)' }}>
            <span style={{ color: 'var(--text)' }}>{h.label}</span>
            <span className="font-semibold tabular-nums" style={{ color: n === 0 ? 'var(--text-muted)' : 'var(--text)' }}>
              {n === 0 ? '—' : `${n} day${n === 1 ? '' : 's'}`}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
