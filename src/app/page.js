'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import AppShell from '@/components/AppShell';
import { useAuth } from '@/lib/auth-context';
import { useTasks, useRoles, createTask } from '@/lib/hooks';
import { fetchEvents } from '@/lib/calendar';
import { getSupabase } from '@/lib/supabase-browser';
import {
  Sun, Clock, Target, Calendar, Plus,
  BookOpen, ChevronDown, ChevronUp, Star, Check
} from 'lucide-react';
import VoiceMic from '@/components/VoiceMic';
import { format, isToday, startOfDay, endOfDay, startOfWeek, endOfWeek } from 'date-fns';

const MOODS = [
  { value: 'great', emoji: '😄', label: 'Great' },
  { value: 'good', emoji: '🙂', label: 'Good' },
  { value: 'okay', emoji: '😐', label: 'Okay' },
  { value: 'tough', emoji: '😔', label: 'Tough' },
  { value: 'bad', emoji: '😞', label: 'Bad' },
];

const JOURNAL_SECTIONS = [
  { key: 'morning_intentions', icon: '🌅', title: 'Morning Intentions', placeholder: 'What are the 3 most important things today?', rows: 3 },
  { key: 'gratitude', icon: '🙏', title: 'Gratitude', placeholder: 'What are you grateful for?', rows: 2 },
  { key: 'reflections', icon: '🧠', title: 'Reflections', placeholder: 'Free-form thoughts, observations, ideas...', rows: 4 },
  { key: 'wins', icon: '🏆', title: 'Wins', placeholder: 'What went well today?', rows: 2 },
  { key: 'lessons', icon: '📈', title: 'Lessons', placeholder: 'What did you learn?', rows: 2 },
];

const EMPTY_CONTENT = { morning_intentions: '', gratitude: '', reflections: '', wins: '', lessons: '' };

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function getWeekString() {
  const now = new Date();
  const weekNum = Math.ceil((((now - new Date(now.getFullYear(), 0, 1)) / 86400000) + new Date(now.getFullYear(), 0, 1).getDay() + 1) / 7);
  return `${now.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

function parseJournalContent(raw) {
  if (!raw) return { ...EMPTY_CONTENT, rating: 0 };
  try { return { ...EMPTY_CONTENT, rating: 0, ...JSON.parse(raw) }; }
  catch { return { ...EMPTY_CONTENT, rating: 0, reflections: raw }; }
}

function useDebounce(callback, delay) {
  const timerRef = useRef(null);
  const callbackRef = useRef(callback);
  callbackRef.current = callback;
  return useCallback((...args) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => callbackRef.current(...args), delay);
  }, [delay]);
}

// ─── Journal Section (collapsible) ─────────────────────────────
function JournalSection({ user }) {
  const [open, setOpen] = useState(false);
  const [entry, setEntry] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [content, setContent] = useState({ ...EMPTY_CONTENT });
  const [mood, setMood] = useState(null);
  const [rating, setRating] = useState(0);

  const dateStr = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    if (!user || !open) return;
    const load = async () => {
      setLoading(true);
      const supabase = getSupabase();
      const { data } = await supabase.from('journal_entries').select('*').eq('user_id', user.id).eq('date', dateStr).single();
      if (data) {
        setEntry(data);
        const parsed = parseJournalContent(data.content);
        setContent({ morning_intentions: parsed.morning_intentions, gratitude: parsed.gratitude, reflections: parsed.reflections, wins: parsed.wins, lessons: parsed.lessons });
        setMood(data.mood);
        setRating(parsed.rating || 0);
      }
      setLoading(false);
    };
    load();
  }, [user, open, dateStr]);

  const saveEntry = useCallback(async (updates) => {
    if (!user) return;
    setSaving(true);
    const supabase = getSupabase();
    const currentContent = updates.content !== undefined ? updates.content : content;
    const currentRating = updates.rating !== undefined ? updates.rating : rating;
    const currentMood = updates.mood !== undefined ? updates.mood : mood;
    const contentJson = JSON.stringify({ ...currentContent, rating: currentRating });
    const payload = { user_id: user.id, date: dateStr, content: contentJson, mood: currentMood, updated_at: new Date().toISOString() };

    let result;
    if (entry?.id) {
      result = await supabase.from('journal_entries').update(payload).eq('id', entry.id).select().single();
    } else {
      result = await supabase.from('journal_entries').insert(payload).select().single();
    }
    if (result.data) setEntry(result.data);
    setSaving(false);
    if (!result.error) { setSaved(true); setTimeout(() => setSaved(false), 2000); }
  }, [user, dateStr, entry, content, mood, rating]);

  const debouncedSave = useDebounce(saveEntry, 800);

  const handleContentChange = (key, value) => {
    const updated = { ...content, [key]: value };
    setContent(updated);
    debouncedSave({ content: updated });
  };

  return (
    <div className="card mt-5" style={{ padding: '1.25rem' }}>
      <div className="flex items-center justify-between cursor-pointer" onClick={() => setOpen(!open)}>
        <div className="flex items-center gap-2">
          <BookOpen size={18} style={{ color: 'var(--accent)' }} />
          <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text)', margin: 0 }}>Journal</h2>
          {saving && <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Saving...</span>}
          {saved && !saving && <span className="text-xs flex items-center gap-1" style={{ color: 'var(--q2)' }}><Check size={12} /> Saved</span>}
        </div>
        {open ? <ChevronUp size={16} style={{ color: 'var(--text-muted)' }} /> : <ChevronDown size={16} style={{ color: 'var(--text-muted)' }} />}
      </div>

      {open && (
        <div className="mt-4 animate-in">
          {loading ? (
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading...</p>
          ) : (
            <>
              {/* Mood + Rating */}
              <div className="flex items-center gap-6 flex-wrap mb-4 pb-4" style={{ borderBottom: '1px solid var(--border)' }}>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-medium mr-1" style={{ color: 'var(--text-muted)' }}>Mood</span>
                  {MOODS.map(m => (
                    <button key={m.value} onClick={() => { setMood(m.value); saveEntry({ mood: m.value }); }} title={m.label}
                      style={{ width: 36, height: 36, borderRadius: 10, fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: mood === m.value ? '2px solid var(--accent)' : '2px solid transparent',
                        background: mood === m.value ? 'var(--accent-bg)' : 'transparent', cursor: 'pointer' }}>
                      {m.emoji}
                    </button>
                  ))}
                </div>
                <div style={{ width: 1, height: 28, background: 'var(--border)' }} />
                <div className="flex items-center gap-1">
                  <span className="text-xs font-medium mr-1" style={{ color: 'var(--text-muted)' }}>Day</span>
                  {[1, 2, 3, 4, 5].map(n => (
                    <button key={n} onClick={() => { setRating(n); saveEntry({ rating: n }); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}>
                      <Star size={22} fill={rating >= n ? '#f59e0b' : 'none'} color={rating >= n ? '#f59e0b' : 'var(--border)'} strokeWidth={1.5} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Journal Sections */}
              {JOURNAL_SECTIONS.map(section => (
                <div key={section.key} className="mb-3">
                  <div className="flex items-center justify-between mb-1.5 px-1">
                    <label className="text-sm font-medium flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                      <span>{section.icon}</span> {section.title}
                    </label>
                    <VoiceMic onAppend={(t) => handleContentChange(section.key, (content[section.key] || '') + (content[section.key] ? ' ' : '') + t)} mode="append" size={14} />
                  </div>
                  <textarea className="input" rows={section.rows} placeholder={section.placeholder}
                    value={content[section.key] || ''} onChange={e => handleContentChange(section.key, e.target.value)}
                    style={{ resize: 'vertical', width: '100%', background: 'var(--bg-card)', borderRadius: 10 }} />
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Today Page ───────────────────────────────────────────
function TodayPage() {
  const { user, getGoogleToken } = useAuth();
  const { data: allTasks, loading: tasksLoading, refetch: refetchTasks } = useTasks();
  const { data: roles } = useRoles();

  const [calendarEvents, setCalendarEvents] = useState([]);
  const [calendarLoading, setCalendarLoading] = useState(true);
  const [calendarError, setCalendarError] = useState(null);
  const [quickText, setQuickText] = useState('');
  const [quickSaving, setQuickSaving] = useState(false);
  const [q2Focus, setQ2Focus] = useState(null);

  const today = new Date();
  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || '';

  const todayTasks = useMemo(() => allTasks.filter(t => {
    if (t.status === 'done') return false;
    if (!t.due_date && !t.scheduled_date) return false;
    const due = t.due_date ? new Date(t.due_date) : null;
    const scheduled = t.scheduled_date ? new Date(t.scheduled_date) : null;
    return (due && isToday(due)) || (scheduled && isToday(scheduled));
  }), [allTasks]);

  const weekStart = startOfWeek(today, { weekStartsOn: 1 }).toISOString();
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 }).toISOString();
  const bigRocks = useMemo(() => allTasks.filter(t => {
    if (t.status === 'done' || !t.is_big_rock) return false;
    const due = t.due_date ? new Date(t.due_date) : null;
    if (!due) return true;
    return due >= new Date(weekStart) && due <= new Date(weekEnd);
  }), [allTasks, weekStart, weekEnd]);

  // Q2 focus for this week (from weekly_reviews.notes)
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const supabase = getSupabase();
      const { data } = await supabase
        .from('weekly_reviews')
        .select('notes')
        .eq('week', getWeekString())
        .maybeSingle();
      setQ2Focus(data?.notes?.trim() || '');
    };
    load();
  }, [user]);

  // Calendar
  useEffect(() => {
    async function loadEvents() {
      const token = getGoogleToken();
      if (!token) { setCalendarLoading(false); setCalendarError('No Google token'); return; }
      try {
        setCalendarLoading(true);
        const now = new Date();
        const events = await fetchEvents(token, startOfDay(now).toISOString(), endOfDay(now).toISOString());
        setCalendarEvents(events);
        setCalendarError(null);
      } catch (err) {
        setCalendarError('Could not load calendar events');
      } finally { setCalendarLoading(false); }
    }
    loadEvents();
  }, [getGoogleToken]);

  const handleQuickCapture = async (e) => {
    e.preventDefault();
    if (!quickText.trim()) return;
    setQuickSaving(true);
    try { await createTask({ title: quickText.trim(), status: 'next_action', due_date: format(today, 'yyyy-MM-dd') }); setQuickText(''); refetchTasks(); }
    catch (err) { console.error('Failed to create task:', err); }
    finally { setQuickSaving(false); }
  };

  const getRoleName = useCallback(roleId => { const role = roles.find(r => r.id === roleId); return role?.name || ''; }, [roles]);

  const formatEventTime = (event) => {
    if (event.start?.dateTime) {
      const start = format(new Date(event.start.dateTime), 'h:mm a');
      const end = event.end?.dateTime ? format(new Date(event.end.dateTime), 'h:mm a') : '';
      return end ? `${start} - ${end}` : start;
    }
    return 'All day';
  };

  return (
    <div className="p-4 md:p-8 max-w-[960px] mx-auto">
      {/* Greeting */}
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
          <Sun size={22} style={{ color: 'var(--warning, #f59e0b)' }} />
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)', margin: 0 }}>
            {getGreeting()}{firstName ? `, ${firstName}` : ''}
          </h1>
        </div>
        <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.85rem' }}>
          {format(today, 'EEEE, MMMM d')}
        </p>
      </div>

      {/* Q2 Focus for this week (from Weekly Review) */}
      {q2Focus !== null && (
        q2Focus ? (
          <div
            className="mb-4"
            style={{
              padding: '0.75rem 1rem',
              borderLeft: '3px solid var(--q2)',
              background: 'color-mix(in srgb, var(--q2) 5%, var(--bg-card))',
              borderRadius: '0 8px 8px 0',
            }}
          >
            <div style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--q2)', marginBottom: '0.25rem' }}>
              🎯 This Week&rsquo;s Q2 Focus
            </div>
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text)', whiteSpace: 'pre-line' }}>{q2Focus}</p>
          </div>
        ) : (
          <a
            href="/weekly-review"
            className="mb-4"
            style={{ display: 'block', padding: '0.75rem 1rem', borderLeft: '3px solid var(--border)', background: 'var(--bg-card)', borderRadius: '0 8px 8px 0', fontSize: '0.8rem', color: 'var(--text-muted)', textDecoration: 'none' }}
          >
            🎯 Set your Q2 focus for this week →
          </a>
        )
      )}

      {/* Quick Capture — top priority action */}
      <form onSubmit={handleQuickCapture} className="mb-5" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <input
          className="input"
          type="text"
          value={quickText}
          onChange={e => setQuickText(e.target.value)}
          placeholder="Capture a task…"
          disabled={quickSaving}
          style={{ flex: 1, padding: '0.7rem 1rem', fontSize: '0.9rem' }}
        />
        <VoiceMic onResult={t => setQuickText(t)} size={16} />
        <button
          className="btn"
          type="submit"
          disabled={quickSaving || !quickText.trim()}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.7rem 1.1rem', fontSize: '0.875rem', opacity: quickSaving || !quickText.trim() ? 0.5 : 1 }}
        >
          <Plus size={16} /> {quickSaving ? 'Adding…' : 'Add'}
        </button>
      </form>

      {/* Main: Today's Tasks (wide) + aside (Big Rocks, Calendar) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Today's Tasks — spans 2/3 on desktop */}
        <div className="card md:col-span-2" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Clock size={18} style={{ color: 'var(--accent)' }} />
            <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text)', margin: 0 }}>Today&apos;s Tasks</h2>
            <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--text-muted)', background: 'var(--bg)', padding: '0.15rem 0.5rem', borderRadius: '999px' }}>{todayTasks.length}</span>
          </div>
          {tasksLoading ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Loading…</p>
          ) : todayTasks.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Nothing scheduled for today. Capture something above.</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {todayTasks.map(task => (
                <li key={task.id} style={{ padding: '0.6rem 0.875rem', borderRadius: '8px', background: 'var(--bg)', border: '1px solid var(--border)', fontSize: '0.875rem', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: task.is_big_rock ? 'var(--accent)' : 'var(--text-muted)', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500 }}>{task.title}</div>
                    {task.role_id && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{getRoleName(task.role_id)}</span>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Aside: Big Rocks + Calendar stacked */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Big Rocks */}
          <div className="card" style={{ padding: '1.1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <Target size={16} style={{ color: 'var(--accent)' }} />
              <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text)', margin: 0 }}>Big Rocks</h3>
            </div>
            {tasksLoading ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Loading…</p>
            ) : bigRocks.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>No big rocks this week.</p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {bigRocks.map(task => (
                  <li key={task.id} style={{ padding: '0.4rem 0.6rem', borderRadius: '6px', background: 'var(--bg)', fontSize: '0.8rem', color: 'var(--text)' }}>
                    <div style={{ fontWeight: 500 }}>{task.title}</div>
                    {task.due_date && <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Due {format(new Date(task.due_date), 'EEE')}</span>}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Calendar */}
          <div className="card" style={{ padding: '1.1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <Calendar size={16} style={{ color: 'var(--accent)' }} />
              <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text)', margin: 0 }}>Calendar</h3>
            </div>
            {calendarLoading ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Loading…</p>
            ) : calendarError ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{calendarError}</p>
            ) : calendarEvents.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Clear day.</p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {calendarEvents.map(event => (
                  <li key={event.id} style={{ padding: '0.4rem 0.6rem', borderRadius: '6px', background: 'var(--bg)', fontSize: '0.8rem' }}>
                    <div style={{ fontWeight: 500, color: 'var(--text)' }}>{event.summary || 'Untitled'}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{formatEventTime(event)}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Journal */}
      <JournalSection user={user} />
    </div>
  );
}

export default function Home() {
  return <AppShell><TodayPage /></AppShell>;
}
