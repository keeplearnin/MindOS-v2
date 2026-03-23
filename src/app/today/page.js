'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import AppShell from '@/components/AppShell';
import { useAuth } from '@/lib/auth-context';
import { useTasks, useRoles, createTask } from '@/lib/hooks';
import { fetchEvents } from '@/lib/calendar';
import { Sun, Clock, Target, Calendar, Plus, Play, Pause, RotateCcw, Coffee } from 'lucide-react';
import { format, isToday, startOfDay, endOfDay, startOfWeek, endOfWeek } from 'date-fns';

const QUOTES = [
  { text: 'Begin with the end in mind.', author: 'Stephen Covey' },
  { text: 'Put first things first.', author: 'Stephen Covey' },
  { text: 'Think win-win.', author: 'Stephen Covey' },
  { text: 'The key is not to prioritize what\'s on your schedule, but to schedule your priorities.', author: 'Stephen Covey' },
  { text: 'Most of us spend too much time on what is urgent and not enough time on what is important.', author: 'Stephen Covey' },
  { text: 'Start with the most important things first.', author: 'Stephen Covey' },
  { text: 'Be proactive.', author: 'Stephen Covey' },
];

const WORK_DURATION = 25 * 60; // 25 minutes in seconds
const BREAK_DURATION = 5 * 60; // 5 minutes in seconds

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function getDailyQuote() {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24)
  );
  return QUOTES[dayOfYear % QUOTES.length];
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function TodayPage() {
  const { user, getGoogleToken } = useAuth();
  const { data: allTasks, loading: tasksLoading, refetch: refetchTasks } = useTasks();
  const { data: roles } = useRoles();

  const [calendarEvents, setCalendarEvents] = useState([]);
  const [calendarLoading, setCalendarLoading] = useState(true);
  const [calendarError, setCalendarError] = useState(null);

  // Quick capture
  const [quickText, setQuickText] = useState('');
  const [quickSaving, setQuickSaving] = useState(false);

  // Focus timer
  const [timerSeconds, setTimerSeconds] = useState(WORK_DURATION);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerMode, setTimerMode] = useState('work'); // 'work' | 'break'
  const intervalRef = useRef(null);

  const today = new Date();
  const quote = getDailyQuote();
  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || '';

  // Filter tasks
  const todayStart = startOfDay(today).toISOString();
  const todayEnd = endOfDay(today).toISOString();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 }).toISOString();
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 }).toISOString();

  const todayTasks = allTasks.filter((t) => {
    if (t.status === 'done') return false;
    if (!t.due_date && !t.scheduled_date) return false;
    const due = t.due_date ? new Date(t.due_date) : null;
    const scheduled = t.scheduled_date ? new Date(t.scheduled_date) : null;
    return (due && isToday(due)) || (scheduled && isToday(scheduled));
  });

  const bigRocks = allTasks.filter((t) => {
    if (t.status === 'done' || !t.is_big_rock) return false;
    const due = t.due_date ? new Date(t.due_date) : null;
    if (!due) return true; // big rocks without a due date still show
    return due >= new Date(weekStart) && due <= new Date(weekEnd);
  });

  // Fetch calendar events
  useEffect(() => {
    async function loadEvents() {
      const token = getGoogleToken();
      if (!token) {
        setCalendarLoading(false);
        setCalendarError('No Google token available');
        return;
      }
      try {
        setCalendarLoading(true);
        const events = await fetchEvents(
          token,
          startOfDay(today).toISOString(),
          endOfDay(today).toISOString()
        );
        setCalendarEvents(events);
        setCalendarError(null);
      } catch (err) {
        console.error('Failed to fetch calendar events:', err);
        setCalendarError('Could not load calendar events');
      } finally {
        setCalendarLoading(false);
      }
    }
    loadEvents();
  }, []);

  // Timer logic
  useEffect(() => {
    if (timerRunning) {
      intervalRef.current = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            setTimerRunning(false);
            // Switch mode
            if (timerMode === 'work') {
              setTimerMode('break');
              return BREAK_DURATION;
            } else {
              setTimerMode('work');
              return WORK_DURATION;
            }
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [timerRunning, timerMode]);

  const toggleTimer = () => setTimerRunning((r) => !r);

  const resetTimer = () => {
    setTimerRunning(false);
    clearInterval(intervalRef.current);
    setTimerMode('work');
    setTimerSeconds(WORK_DURATION);
  };

  // Quick capture handler
  const handleQuickCapture = async (e) => {
    e.preventDefault();
    if (!quickText.trim()) return;
    setQuickSaving(true);
    try {
      await createTask({
        title: quickText.trim(),
        status: 'next_action',
        due_date: format(today, 'yyyy-MM-dd'),
      });
      setQuickText('');
      refetchTasks();
    } catch (err) {
      console.error('Failed to create task:', err);
    } finally {
      setQuickSaving(false);
    }
  };

  const getRoleName = useCallback(
    (roleId) => {
      const role = roles.find((r) => r.id === roleId);
      return role?.name || '';
    },
    [roles]
  );

  const formatEventTime = (event) => {
    if (event.start?.dateTime) {
      const start = format(new Date(event.start.dateTime), 'h:mm a');
      const end = event.end?.dateTime ? format(new Date(event.end.dateTime), 'h:mm a') : '';
      return end ? `${start} - ${end}` : start;
    }
    return 'All day';
  };

  const timerProgress = timerMode === 'work'
    ? ((WORK_DURATION - timerSeconds) / WORK_DURATION) * 100
    : ((BREAK_DURATION - timerSeconds) / BREAK_DURATION) * 100;

  return (
    <div className="p-4 md:p-8 max-w-[900px] mx-auto">
      {/* Greeting */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <Sun size={28} style={{ color: 'var(--warning, #f59e0b)' }} />
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text)', margin: 0 }}>
            {getGreeting()}{firstName ? `, ${firstName}` : ''}
          </h1>
        </div>
        <p style={{ color: 'var(--text-muted)', margin: '0 0 0.75rem 0', fontSize: '0.95rem' }}>
          {format(today, 'EEEE, MMMM d, yyyy')}
        </p>
        <blockquote
          style={{
            margin: 0,
            padding: '0.75rem 1rem',
            borderLeft: '3px solid var(--accent)',
            background: 'var(--bg-card, var(--surface, rgba(255,255,255,0.03)))',
            borderRadius: '0 8px 8px 0',
            fontStyle: 'italic',
            color: 'var(--text-muted)',
            fontSize: '0.9rem',
          }}
        >
          &ldquo;{quote.text}&rdquo;
          <span style={{ display: 'block', marginTop: '0.25rem', fontSize: '0.8rem', fontStyle: 'normal' }}>
            — {quote.author}
          </span>
        </blockquote>
      </div>

      {/* Grid layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Big Rocks */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Target size={18} style={{ color: 'var(--accent)' }} />
            <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text)', margin: 0 }}>
              Big Rocks This Week
            </h2>
          </div>
          {tasksLoading ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Loading...</p>
          ) : bigRocks.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              No big rocks set for this week. What matters most?
            </p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {bigRocks.map((task) => (
                <li
                  key={task.id}
                  style={{
                    padding: '0.5rem 0.75rem',
                    borderRadius: '6px',
                    background: 'var(--bg, rgba(255,255,255,0.02))',
                    border: '1px solid var(--border)',
                    fontSize: '0.875rem',
                    color: 'var(--text)',
                  }}
                >
                  <div style={{ fontWeight: 500 }}>{task.title}</div>
                  {task.role_id && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {getRoleName(task.role_id)}
                    </span>
                  )}
                  {task.due_date && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                      Due {format(new Date(task.due_date), 'EEE')}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Calendar Events */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Calendar size={18} style={{ color: 'var(--accent)' }} />
            <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text)', margin: 0 }}>
              Today&apos;s Calendar
            </h2>
          </div>
          {calendarLoading ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Loading events...</p>
          ) : calendarError ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{calendarError}</p>
          ) : calendarEvents.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              No events today. A clear day for deep work.
            </p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {calendarEvents.map((event) => (
                <li
                  key={event.id}
                  style={{
                    padding: '0.5rem 0.75rem',
                    borderRadius: '6px',
                    background: 'var(--bg, rgba(255,255,255,0.02))',
                    border: '1px solid var(--border)',
                    fontSize: '0.875rem',
                  }}
                >
                  <div style={{ fontWeight: 500, color: 'var(--text)' }}>
                    {event.summary || 'Untitled event'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                    {formatEventTime(event)}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Today's Tasks */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Clock size={18} style={{ color: 'var(--accent)' }} />
            <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text)', margin: 0 }}>
              Today&apos;s Tasks
            </h2>
            <span
              style={{
                marginLeft: 'auto',
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                background: 'var(--bg, rgba(255,255,255,0.05))',
                padding: '0.15rem 0.5rem',
                borderRadius: '999px',
              }}
            >
              {todayTasks.length}
            </span>
          </div>
          {tasksLoading ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Loading...</p>
          ) : todayTasks.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Nothing scheduled for today. Use Quick Capture below to add tasks.
            </p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {todayTasks.map((task) => (
                <li
                  key={task.id}
                  style={{
                    padding: '0.5rem 0.75rem',
                    borderRadius: '6px',
                    background: 'var(--bg, rgba(255,255,255,0.02))',
                    border: '1px solid var(--border)',
                    fontSize: '0.875rem',
                    color: 'var(--text)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: task.is_big_rock ? 'var(--accent)' : 'var(--text-muted)',
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500 }}>{task.title}</div>
                    {task.role_id && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {getRoleName(task.role_id)}
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Focus Timer */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            {timerMode === 'work' ? (
              <Target size={18} style={{ color: 'var(--accent)' }} />
            ) : (
              <Coffee size={18} style={{ color: 'var(--warning, #f59e0b)' }} />
            )}
            <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text)', margin: 0 }}>
              Focus Timer
            </h2>
            <span
              style={{
                marginLeft: 'auto',
                fontSize: '0.7rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: timerMode === 'work' ? 'var(--accent)' : 'var(--warning, #f59e0b)',
                fontWeight: 600,
              }}
            >
              {timerMode === 'work' ? 'Work' : 'Break'}
            </span>
          </div>

          {/* Timer display */}
          <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
            <div
              style={{
                fontSize: '3rem',
                fontWeight: 700,
                fontVariantNumeric: 'tabular-nums',
                color: 'var(--text)',
                letterSpacing: '0.05em',
              }}
            >
              {formatTime(timerSeconds)}
            </div>
            {/* Progress bar */}
            <div
              style={{
                width: '100%',
                height: '4px',
                borderRadius: '2px',
                background: 'var(--border)',
                marginTop: '0.75rem',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${timerProgress}%`,
                  background: timerMode === 'work' ? 'var(--accent)' : 'var(--warning, #f59e0b)',
                  borderRadius: '2px',
                  transition: 'width 1s linear',
                }}
              />
            </div>
          </div>

          {/* Timer controls */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem' }}>
            <button
              className="btn"
              onClick={toggleTimer}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.5rem 1.25rem',
                fontSize: '0.875rem',
              }}
            >
              {timerRunning ? <Pause size={16} /> : <Play size={16} />}
              {timerRunning ? 'Pause' : 'Start'}
            </button>
            <button
              className="btn"
              onClick={resetTimer}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.5rem 1rem',
                fontSize: '0.875rem',
                background: 'transparent',
                border: '1px solid var(--border)',
              }}
            >
              <RotateCcw size={16} />
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Quick Capture */}
      <div className="card" style={{ padding: '1.25rem', marginTop: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <Plus size={18} style={{ color: 'var(--accent)' }} />
          <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text)', margin: 0 }}>
            Quick Capture
          </h2>
        </div>
        <form onSubmit={handleQuickCapture} style={{ display: 'flex', gap: '0.75rem' }}>
          <input
            className="input"
            type="text"
            value={quickText}
            onChange={(e) => setQuickText(e.target.value)}
            placeholder="What needs to get done today?"
            disabled={quickSaving}
            style={{
              flex: 1,
              padding: '0.6rem 0.875rem',
              fontSize: '0.875rem',
            }}
          />
          <button
            className="btn"
            type="submit"
            disabled={quickSaving || !quickText.trim()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.6rem 1.25rem',
              fontSize: '0.875rem',
              opacity: quickSaving || !quickText.trim() ? 0.5 : 1,
            }}
          >
            <Plus size={16} />
            {quickSaving ? 'Adding...' : 'Add'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <AppShell>
      <TodayPage />
    </AppShell>
  );
}
