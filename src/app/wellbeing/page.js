'use client';

import AppShell from '@/components/AppShell';
import { useMoodEntries, useJournalEntries, useHealthLogs, upsertHealthLog } from '@/lib/hooks';
import { Heart, Calendar, TrendingUp, Flame, BookOpen, Zap, Activity } from 'lucide-react';
import { useState } from 'react';
import { format, parseISO, subDays, differenceInDays, startOfDay } from 'date-fns';

const MOOD_LABELS = { 1: 'Awful', 2: 'Low', 3: 'Okay', 4: 'Good', 5: 'Great' };
const MOOD_EMOJI = { 1: '😫', 2: '😔', 3: '😐', 4: '🙂', 5: '😊' };
const MOOD_COLORS = {
  1: '#dc2626', 2: '#d97706', 3: '#94a3b8', 4: '#059669', 5: '#2563eb',
};
const ENERGY_EMOJI = { 1: '🔋', 2: '🪫', 3: '⚡', 4: '💪', 5: '🔥' };

function StatCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="card flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: `${color}15` }}>
        <Icon size={20} style={{ color }} />
      </div>
      <div>
        <p className="text-2xl font-bold" style={{ color: 'var(--text)' }}>{value}</p>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</p>
        {sub && <p className="text-xs mt-0.5" style={{ color }}>{sub}</p>}
      </div>
    </div>
  );
}

// Heatmap: 30-day grid showing mood check-in days
function MoodHeatmap({ entries }) {
  const today = startOfDay(new Date());
  const days = [];
  for (let i = 29; i >= 0; i--) {
    days.push(subDays(today, i));
  }

  // Group entries by date
  const byDate = {};
  entries.forEach(e => {
    const d = format(new Date(e.created_at), 'yyyy-MM-dd');
    if (!byDate[d]) byDate[d] = [];
    byDate[d].push(e);
  });

  return (
    <div className="card">
      <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
        <Calendar size={16} style={{ color: 'var(--accent)' }} />
        30-Day Check-in Heatmap
      </h3>
      <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(10, 1fr)' }}>
        {days.map(day => {
          const key = format(day, 'yyyy-MM-dd');
          const dayEntries = byDate[key];
          const hasEntry = !!dayEntries;
          const avgMood = hasEntry
            ? Math.round(dayEntries.reduce((s, e) => s + e.mood, 0) / dayEntries.length)
            : 0;
          const isToday = differenceInDays(today, day) === 0;

          return (
            <div
              key={key}
              className="rounded aspect-square flex items-center justify-center text-xs"
              style={{
                background: hasEntry ? `${MOOD_COLORS[avgMood]}20` : 'var(--bg)',
                border: isToday ? '2px solid var(--accent)' : '1px solid var(--border)',
                color: hasEntry ? MOOD_COLORS[avgMood] : 'var(--text-muted)',
                fontSize: '0.6rem',
                fontWeight: hasEntry ? 600 : 400,
              }}
              title={`${format(day, 'MMM d')}: ${hasEntry ? `${MOOD_LABELS[avgMood]} (${dayEntries.length} check-in${dayEntries.length > 1 ? 's' : ''})` : 'No check-in'}`}
            >
              {hasEntry ? MOOD_EMOJI[avgMood] : format(day, 'd')}
            </div>
          );
        })}
      </div>
      <div className="flex justify-between mt-2">
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{format(days[0], 'MMM d')}</span>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Today</span>
      </div>
    </div>
  );
}

// Mood trend line — 14-day average
function MoodTrendChart({ entries }) {
  const today = startOfDay(new Date());
  const days = [];
  for (let i = 13; i >= 0; i--) days.push(subDays(today, i));

  const byDate = {};
  entries.forEach(e => {
    const d = format(new Date(e.created_at), 'yyyy-MM-dd');
    if (!byDate[d]) byDate[d] = [];
    byDate[d].push(e);
  });

  const points = days.map(day => {
    const key = format(day, 'yyyy-MM-dd');
    const dayEntries = byDate[key];
    if (!dayEntries) return null;
    return dayEntries.reduce((s, e) => s + e.mood, 0) / dayEntries.length;
  });

  // SVG line chart
  const width = 100;
  const height = 40;
  const validPoints = points.map((p, i) => p !== null ? { x: (i / 13) * width, y: height - ((p - 1) / 4) * height } : null).filter(Boolean);

  if (validPoints.length < 2) return null;

  const pathD = validPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');

  return (
    <div className="card">
      <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
        <TrendingUp size={16} style={{ color: 'var(--q2)' }} />
        Mood Trend (14 days)
      </h3>
      <svg viewBox={`-2 -2 ${width + 4} ${height + 4}`} className="w-full" style={{ height: '80px' }}>
        {/* Grid lines */}
        {[1, 2, 3, 4, 5].map(v => {
          const y = height - ((v - 1) / 4) * height;
          return <line key={v} x1={0} y1={y} x2={width} y2={y} stroke="var(--border)" strokeWidth="0.3" />;
        })}
        {/* Line */}
        <path d={pathD} fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        {/* Dots */}
        {validPoints.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="2" fill="var(--accent)" />
        ))}
      </svg>
      <div className="flex justify-between mt-1">
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{format(days[0], 'MMM d')}</span>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Today</span>
      </div>
      <div className="flex justify-between mt-0.5">
        {[1, 3, 5].map(v => (
          <span key={v} className="text-xs" style={{ color: 'var(--text-muted)' }}>{MOOD_LABELS[v]}</span>
        ))}
      </div>
    </div>
  );
}

// Tag frequency breakdown
function TagBreakdown({ entries }) {
  const tagCounts = {};
  entries.forEach(e => {
    (e.tags || []).forEach(t => {
      tagCounts[t] = (tagCounts[t] || 0) + 1;
    });
  });

  const sorted = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]);
  if (sorted.length === 0) return null;

  const max = sorted[0][1];

  return (
    <div className="card">
      <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
        <Zap size={16} style={{ color: 'var(--warning)' }} />
        What affects your mood
      </h3>
      <div className="space-y-2">
        {sorted.slice(0, 8).map(([tag, count]) => (
          <div key={tag} className="flex items-center gap-3">
            <span className="text-xs font-medium w-16 shrink-0" style={{ color: 'var(--text-secondary)' }}>{tag}</span>
            <div className="flex-1 h-5 rounded-full overflow-hidden" style={{ background: 'var(--bg)' }}>
              <div
                className="h-full rounded-full"
                style={{
                  width: `${(count / max) * 100}%`,
                  background: 'var(--accent)',
                  opacity: 0.7,
                  minWidth: '8px',
                }}
              />
            </div>
            <span className="text-xs shrink-0" style={{ color: 'var(--text-muted)' }}>{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Journal streak + stats
function JournalStats({ journalEntries, moodEntries }) {
  // Journal streak: consecutive days with an entry
  const journalDates = new Set(journalEntries.map(e => e.date));
  let journalStreak = 0;
  const today = format(new Date(), 'yyyy-MM-dd');
  let checkDate = today;
  while (journalDates.has(checkDate)) {
    journalStreak++;
    checkDate = format(subDays(parseISO(checkDate), 1), 'yyyy-MM-dd');
  }

  // Mood check-in streak
  const moodDates = new Set(moodEntries.map(e => format(new Date(e.created_at), 'yyyy-MM-dd')));
  let moodStreak = 0;
  checkDate = today;
  while (moodDates.has(checkDate)) {
    moodStreak++;
    checkDate = format(subDays(parseISO(checkDate), 1), 'yyyy-MM-dd');
  }

  // Days with entries in last 30 days
  const last30 = new Set();
  for (let i = 0; i < 30; i++) {
    const d = format(subDays(new Date(), i), 'yyyy-MM-dd');
    if (journalDates.has(d) || moodDates.has(d)) last30.add(d);
  }

  // Average mood overall
  const avgMood = moodEntries.length > 0
    ? (moodEntries.reduce((s, e) => s + e.mood, 0) / moodEntries.length).toFixed(1)
    : '—';

  // This week vs last week mood
  const thisWeekEntries = moodEntries.filter(e => differenceInDays(new Date(), new Date(e.created_at)) < 7);
  const lastWeekEntries = moodEntries.filter(e => {
    const days = differenceInDays(new Date(), new Date(e.created_at));
    return days >= 7 && days < 14;
  });
  const thisWeekAvg = thisWeekEntries.length > 0
    ? thisWeekEntries.reduce((s, e) => s + e.mood, 0) / thisWeekEntries.length
    : 0;
  const lastWeekAvg = lastWeekEntries.length > 0
    ? lastWeekEntries.reduce((s, e) => s + e.mood, 0) / lastWeekEntries.length
    : 0;
  const moodDelta = thisWeekAvg && lastWeekAvg ? thisWeekAvg - lastWeekAvg : null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <StatCard
        icon={Flame}
        label="Journal Streak"
        value={`${journalStreak}d`}
        color="var(--warning)"
        sub={journalStreak > 0 ? 'Keep it going!' : 'Start today'}
      />
      <StatCard
        icon={Heart}
        label="Mood Streak"
        value={`${moodStreak}d`}
        color="var(--danger)"
        sub={`${moodEntries.length} total check-ins`}
      />
      <StatCard
        icon={Calendar}
        label="Active Days (30d)"
        value={`${last30.size}/30`}
        color="var(--accent)"
        sub={`${Math.round((last30.size / 30) * 100)}% consistency`}
      />
      <StatCard
        icon={TrendingUp}
        label="Avg Mood"
        value={avgMood}
        color="var(--q2)"
        sub={moodDelta !== null ? (moodDelta >= 0 ? `↑ ${moodDelta.toFixed(1)} vs last week` : `↓ ${Math.abs(moodDelta).toFixed(1)} vs last week`) : 'Not enough data'}
      />
    </div>
  );
}

// Recent mood entries timeline
function RecentEntries({ entries }) {
  if (entries.length === 0) return null;

  // Group by date
  const grouped = {};
  entries.slice(0, 20).forEach(e => {
    const day = format(new Date(e.created_at), 'yyyy-MM-dd');
    if (!grouped[day]) grouped[day] = [];
    grouped[day].push(e);
  });

  return (
    <div className="card">
      <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
        <BookOpen size={16} style={{ color: 'var(--accent)' }} />
        Recent Check-ins
      </h3>
      <div className="space-y-4">
        {Object.entries(grouped).slice(0, 7).map(([date, dayEntries]) => (
          <div key={date}>
            <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>
              {format(parseISO(date), 'EEEE, MMM d')}
            </p>
            <div className="space-y-1.5">
              {dayEntries.map(e => (
                <div key={e.id} className="flex items-start gap-3 p-2.5 rounded-lg" style={{ background: 'var(--bg)' }}>
                  <span style={{ fontSize: '1.25rem' }}>{e.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium" style={{ color: MOOD_COLORS[e.mood] }}>
                        {MOOD_LABELS[e.mood]}
                      </span>
                      {e.energy && (
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          {ENERGY_EMOJI[e.energy]} Energy {e.energy}/5
                        </span>
                      )}
                      <span className="text-xs ml-auto shrink-0" style={{ color: 'var(--text-muted)' }}>
                        {format(new Date(e.created_at), 'h:mm a')}
                      </span>
                    </div>
                    {e.note && (
                      <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{e.note}</p>
                    )}
                    {e.tags && e.tags.length > 0 && (
                      <div className="flex gap-1 mt-1.5">
                        {e.tags.map(t => (
                          <span key={t} className="text-xs px-1.5 py-0.5 rounded"
                            style={{ background: 'var(--bg-card)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Health Habits Panel ────────────────────────────────────────

const HABITS = [
  { key: 'cardio',        label: 'Cardio',       emoji: '🏃', desc: '30 min Zone 2' },
  { key: 'sauna',         label: 'Sauna',        emoji: '🧖', desc: '15 min dry/infrared' },
  { key: 'breathing',     label: 'Breathing',    emoji: '🫁', desc: '4-7-8 technique' },
  { key: 'mediterranean', label: 'Med Diet',     emoji: '🥗', desc: 'Olive oil, fish, greens' },
  { key: 'no_news',       label: 'News Limit',   emoji: '📵', desc: 'Max 15 min, not AM/PM' },
];

function habitStreak(logs, habitKey) {
  // logs sorted desc by date
  let streak = 0;
  const today = format(new Date(), 'yyyy-MM-dd');
  for (let i = 0; i < logs.length; i++) {
    const expected = format(subDays(new Date(today), i), 'yyyy-MM-dd');
    const log = logs.find(l => l.date === expected);
    if (log && log.habits && log.habits.includes(habitKey)) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

function BPTrendChart({ logs }) {
  const bpLogs = logs.filter(l => l.bp_systolic && l.bp_diastolic).slice(0, 30).reverse();
  if (bpLogs.length < 2) return null;

  const width = 100;
  const height = 50;
  const minBP = 80;
  const maxBP = 160;
  const range = maxBP - minBP;

  const sysPoints = bpLogs.map((l, i) => ({
    x: (i / (bpLogs.length - 1)) * width,
    y: height - ((l.bp_systolic - minBP) / range) * height,
  }));
  const diaPoints = bpLogs.map((l, i) => ({
    x: (i / (bpLogs.length - 1)) * width,
    y: height - ((l.bp_diastolic - minBP) / range) * height,
  }));

  const toPath = pts => pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const goalY = height - ((120 - minBP) / range) * height;

  const latest = bpLogs[bpLogs.length - 1];

  return (
    <div className="card">
      <h3 className="text-sm font-semibold mb-1 flex items-center gap-2">
        <Activity size={16} style={{ color: 'var(--danger)' }} />
        Blood Pressure Trend
      </h3>
      <div className="flex items-baseline gap-3 mb-3">
        <span className="text-2xl font-bold" style={{ color: latest.bp_systolic < 130 ? 'var(--q2)' : 'var(--warning)' }}>
          {latest.bp_systolic}/{latest.bp_diastolic}
        </span>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>mmHg · {format(parseISO(latest.date), 'MMM d')}</span>
        <span className="text-xs ml-auto" style={{ color: latest.bp_systolic < 120 ? 'var(--q2)' : latest.bp_systolic < 130 ? 'var(--warning)' : 'var(--danger)' }}>
          {latest.bp_systolic < 120 ? 'Normal' : latest.bp_systolic < 130 ? 'Elevated' : 'High'}
        </span>
      </div>
      <svg viewBox={`-2 -2 ${width + 4} ${height + 4}`} className="w-full" style={{ height: '70px' }}>
        {/* Goal line at 120 */}
        <line x1={0} y1={goalY} x2={width} y2={goalY} stroke="var(--q2)" strokeWidth="0.5" strokeDasharray="2,2" />
        <text x={width + 1} y={goalY + 2} fontSize="4" fill="var(--q2)">120</text>
        {/* Diastolic line */}
        <path d={toPath(diaPoints)} fill="none" stroke="var(--accent)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
        {/* Systolic line */}
        <path d={toPath(sysPoints)} fill="none" stroke="var(--danger)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        {/* Latest dots */}
        <circle cx={sysPoints[sysPoints.length - 1].x} cy={sysPoints[sysPoints.length - 1].y} r="2.5" fill="var(--danger)" />
        <circle cx={diaPoints[diaPoints.length - 1].x} cy={diaPoints[diaPoints.length - 1].y} r="2" fill="var(--accent)" />
      </svg>
      <div className="flex gap-4 mt-2">
        <span className="text-xs flex items-center gap-1" style={{ color: 'var(--danger)' }}>
          <span className="inline-block w-3 h-0.5 rounded" style={{ background: 'var(--danger)' }} /> Systolic
        </span>
        <span className="text-xs flex items-center gap-1" style={{ color: 'var(--accent)' }}>
          <span className="inline-block w-3 h-0.5 rounded" style={{ background: 'var(--accent)', opacity: 0.6 }} /> Diastolic
        </span>
        <span className="text-xs flex items-center gap-1" style={{ color: 'var(--q2)' }}>
          <span className="inline-block w-3 h-0.5 rounded" style={{ background: 'var(--q2)' }} /> Goal 120
        </span>
      </div>
    </div>
  );
}

function TodayHabits({ logs, refetch }) {
  const today = format(new Date(), 'yyyy-MM-dd');
  const todayLog = logs.find(l => l.date === today);
  const [checked, setChecked] = useState(todayLog?.habits || []);
  const [sys, setSys] = useState('');
  const [dia, setDia] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const toggle = (key) => {
    setChecked(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await upsertHealthLog({
        date: today,
        habits: checked,
        bp_systolic: sys ? parseInt(sys) : null,
        bp_diastolic: dia ? parseInt(dia) : null,
      });
      setSaved(true);
      setSys('');
      setDia('');
      refetch();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const allDone = checked.length === HABITS.length;

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Heart size={16} style={{ color: 'var(--danger)' }} />
          Today&apos;s Health Habits
        </h3>
        <span className="text-xs font-medium px-2 py-0.5 rounded-full"
          style={{ background: allDone ? 'var(--q2-bg, #d1fae5)' : 'var(--bg)', color: allDone ? 'var(--q2)' : 'var(--text-muted)', border: '1px solid var(--border)' }}>
          {checked.length}/{HABITS.length}
        </span>
      </div>

      <div className="space-y-2 mb-4">
        {HABITS.map(h => (
          <button
            key={h.key}
            onClick={() => toggle(h.key)}
            className="w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left"
            style={{
              background: checked.includes(h.key) ? 'var(--accent-bg)' : 'var(--bg)',
              border: checked.includes(h.key) ? '1.5px solid var(--accent)' : '1.5px solid var(--border)',
              cursor: 'pointer',
            }}
          >
            <span style={{ fontSize: '1.25rem', lineHeight: 1 }}>{h.emoji}</span>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium block" style={{ color: checked.includes(h.key) ? 'var(--accent)' : 'var(--text)' }}>
                {h.label}
              </span>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{h.desc}</span>
            </div>
            <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
              style={{ background: checked.includes(h.key) ? 'var(--accent)' : 'var(--border)' }}>
              {checked.includes(h.key) && <span style={{ color: 'white', fontSize: '0.65rem', fontWeight: 700 }}>✓</span>}
            </div>
          </button>
        ))}
      </div>

      {/* BP input */}
      <div className="mb-4">
        <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Blood Pressure (optional)</p>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Systolic"
            value={sys}
            onChange={e => setSys(e.target.value)}
            className="input flex-1 text-sm"
            min={60} max={250}
          />
          <span style={{ color: 'var(--text-muted)' }}>/</span>
          <input
            type="number"
            placeholder="Diastolic"
            value={dia}
            onChange={e => setDia(e.target.value)}
            className="input flex-1 text-sm"
            min={40} max={150}
          />
          <span className="text-xs shrink-0" style={{ color: 'var(--text-muted)' }}>mmHg</span>
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving || checked.length === 0}
        className="btn btn-primary w-full justify-center py-2.5"
        style={{ opacity: saving || checked.length === 0 ? 0.5 : 1 }}
      >
        {saved ? '✓ Saved!' : saving ? 'Saving...' : 'Log Today'}
      </button>
    </div>
  );
}

function HabitStreaks({ logs }) {
  return (
    <div className="card">
      <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
        <Flame size={16} style={{ color: 'var(--warning)' }} />
        Habit Streaks
      </h3>
      <div className="space-y-2.5">
        {HABITS.map(h => {
          const streak = habitStreak(logs, h.key);
          const completions = logs.filter(l => l.habits && l.habits.includes(h.key)).length;
          return (
            <div key={h.key} className="flex items-center gap-3">
              <span style={{ fontSize: '1.1rem', lineHeight: 1, width: '1.5rem', textAlign: 'center' }}>{h.emoji}</span>
              <span className="text-xs font-medium w-20 shrink-0" style={{ color: 'var(--text-secondary)' }}>{h.label}</span>
              <div className="flex-1 h-4 rounded-full overflow-hidden" style={{ background: 'var(--bg)' }}>
                <div className="h-full rounded-full" style={{
                  width: `${Math.min((completions / 30) * 100, 100)}%`,
                  background: streak >= 7 ? 'var(--q2)' : streak >= 3 ? 'var(--accent)' : 'var(--warning)',
                  minWidth: completions > 0 ? '6px' : '0',
                  transition: 'width 0.3s ease',
                }} />
              </div>
              <div className="text-right shrink-0 w-16">
                <span className="text-sm font-bold" style={{ color: streak >= 7 ? 'var(--q2)' : streak >= 3 ? 'var(--accent)' : 'var(--text-muted)' }}>
                  {streak > 0 ? `${streak}d 🔥` : '—'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-xs mt-3" style={{ color: 'var(--text-muted)' }}>Bar shows last 30 days. Streak = consecutive days.</p>
    </div>
  );
}

function HabitHeatmap({ logs }) {
  const today = startOfDay(new Date());
  const days = [];
  for (let i = 29; i >= 0; i--) days.push(subDays(today, i));

  const byDate = {};
  logs.forEach(l => { byDate[l.date] = l; });

  return (
    <div className="card">
      <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
        <Calendar size={16} style={{ color: 'var(--accent)' }} />
        30-Day Habit Heatmap
      </h3>
      <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(10, 1fr)' }}>
        {days.map(day => {
          const key = format(day, 'yyyy-MM-dd');
          const log = byDate[key];
          const count = log?.habits?.length || 0;
          const isToday = differenceInDays(today, day) === 0;
          const intensity = count === 0 ? 0 : count / HABITS.length;
          return (
            <div
              key={key}
              className="rounded aspect-square flex items-center justify-center"
              style={{
                background: count === 0 ? 'var(--bg)' : `rgba(37, 99, 235, ${0.15 + intensity * 0.7})`,
                border: isToday ? '2px solid var(--accent)' : '1px solid var(--border)',
                fontSize: '0.55rem',
                color: count > 0 ? 'white' : 'var(--text-muted)',
                fontWeight: 600,
              }}
              title={`${format(day, 'MMM d')}: ${count}/${HABITS.length} habits${log?.bp_systolic ? ` · BP ${log.bp_systolic}/${log.bp_diastolic}` : ''}`}
            >
              {count > 0 ? count : format(day, 'd')}
            </div>
          );
        })}
      </div>
      <div className="flex justify-between mt-2">
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{format(days[0], 'MMM d')}</span>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Today</span>
      </div>
    </div>
  );
}

function WellbeingDashboard() {
  const { data: moodEntries, loading: moodLoading } = useMoodEntries(200);
  const { data: journalEntries, loading: journalLoading } = useJournalEntries(30);
  const { data: healthLogs, loading: healthLoading, refetch: refetchHealth } = useHealthLogs(90);

  if (moodLoading || journalLoading || healthLoading) {
    return (
      <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
        Loading dashboard...
      </div>
    );
  }

  return (
    <div className="max-w-4xl animate-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Heart size={24} style={{ color: 'var(--danger)' }} />
          Wellbeing Dashboard
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Track your mood, energy, and journaling consistency
        </p>
      </div>

      {/* Stats row */}
      <JournalStats journalEntries={journalEntries} moodEntries={moodEntries} />

      {/* ── Health Habits Section ── */}
      <div className="mb-2 mt-6">
        <h2 className="text-base font-semibold flex items-center gap-2" style={{ color: 'var(--text)' }}>
          <Activity size={18} style={{ color: 'var(--danger)' }} />
          BP Health Plan
        </h2>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
          Cardio · Sauna · Breathing · Mediterranean diet · News limit
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <TodayHabits logs={healthLogs} refetch={refetchHealth} />
        <HabitStreaks logs={healthLogs} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <HabitHeatmap logs={healthLogs} />
        <BPTrendChart logs={healthLogs} />
      </div>

      {/* ── Mood Section ── */}
      <div className="mb-2 mt-2">
        <h2 className="text-base font-semibold flex items-center gap-2" style={{ color: 'var(--text)' }}>
          <Heart size={18} style={{ color: 'var(--danger)' }} />
          Mood & Energy
        </h2>
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <MoodHeatmap entries={moodEntries} />
        <MoodTrendChart entries={moodEntries} />
      </div>

      {/* Tag breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <TagBreakdown entries={moodEntries} />
        <RecentEntries entries={moodEntries} />
      </div>

      {moodEntries.length === 0 && (
        <div className="card text-center py-12">
          <span className="text-5xl mb-4 block">😊</span>
          <h2 className="text-lg font-semibold mb-2">No check-ins yet</h2>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Tap the 😊 button to start logging how you feel. Your data will appear here.
          </p>
        </div>
      )}
    </div>
  );
}

export default function Page() {
  return <AppShell><WellbeingDashboard /></AppShell>;
}
