'use client';

import AppShell from '@/components/AppShell';
import { useAuth } from '@/lib/auth-context';
import { fetchEvents, createEvent } from '@/lib/calendar';
import { useState, useEffect } from 'react';
import { Calendar as CalIcon, RefreshCw, Plus, Clock, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';

function CalendarPage() {
  const { getGoogleToken } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [showCreate, setShowCreate] = useState(false);
  const [newEvent, setNewEvent] = useState({ summary: '', date: '', startTime: '09:00', endTime: '10:00', description: '' });
  const [activeDayIndex, setActiveDayIndex] = useState(new Date().getDay() === 0 ? 6 : new Date().getDay() - 1); // Mon=0

  const token = getGoogleToken();
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const loadEvents = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const timeMin = weekStart.toISOString();
      const timeMax = addDays(weekStart, 7).toISOString();
      const data = await fetchEvents(token, timeMin, timeMax);
      setEvents(data);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (token) loadEvents();
  }, [token, weekStart]);

  const handleCreateEvent = async () => {
    if (!newEvent.summary || !newEvent.date) return;
    try {
      await createEvent(token, {
        summary: newEvent.summary,
        description: newEvent.description,
        start: { dateTime: `${newEvent.date}T${newEvent.startTime}:00`, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
        end: { dateTime: `${newEvent.date}T${newEvent.endTime}:00`, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
      });
      setShowCreate(false);
      setNewEvent({ summary: '', date: '', startTime: '09:00', endTime: '10:00', description: '' });
      loadEvents();
    } catch (err) {
      setError(err.message);
    }
  };

  const getEventsForDay = (day) => {
    return events.filter(e => {
      const start = e.start?.dateTime || e.start?.date;
      if (!start) return false;
      return isSameDay(new Date(start), day);
    });
  };

  if (!token) {
    return (
      <div className="max-w-5xl animate-in">
        <h1 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <CalIcon size={24} style={{ color: 'var(--accent)' }} /> Calendar
        </h1>
        <div className="card text-center py-12">
          <div className="text-4xl mb-4">🔒</div>
          <p>Sign out and sign back in to grant Calendar access.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl animate-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CalIcon size={24} style={{ color: 'var(--accent)' }} /> Calendar
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Habit 3: Schedule your Big Rocks first, then fill in the gravel
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowCreate(!showCreate)} className="btn btn-primary">
            <Plus size={16} /> New Event
          </button>
          <button onClick={loadEvents} className="btn btn-ghost" disabled={loading}>
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Week navigation */}
      <div className="flex items-center gap-4 mb-4">
        <button onClick={() => setWeekStart(addDays(weekStart, -7))} className="btn btn-ghost p-2">
          <ChevronLeft size={16} />
        </button>
        <span className="font-medium">
          {format(weekStart, 'MMM d')} — {format(addDays(weekStart, 6), 'MMM d, yyyy')}
        </span>
        <button onClick={() => setWeekStart(addDays(weekStart, 7))} className="btn btn-ghost p-2">
          <ChevronRight size={16} />
        </button>
        <button onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))} className="btn btn-ghost text-xs">
          Today
        </button>
      </div>

      {/* Create Event Modal */}
      {showCreate && (
        <div className="card mb-4 animate-in">
          <h3 className="font-semibold mb-3">Create Event</h3>
          <div className="space-y-3">
            <input className="input" placeholder="Event title" value={newEvent.summary} onChange={e => setNewEvent({ ...newEvent, summary: e.target.value })} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input type="date" className="input" value={newEvent.date} onChange={e => setNewEvent({ ...newEvent, date: e.target.value })} />
              <div className="flex gap-2">
                <input type="time" className="input" value={newEvent.startTime} onChange={e => setNewEvent({ ...newEvent, startTime: e.target.value })} />
                <input type="time" className="input" value={newEvent.endTime} onChange={e => setNewEvent({ ...newEvent, endTime: e.target.value })} />
              </div>
            </div>
            <textarea className="input" placeholder="Description (optional)" rows={2} value={newEvent.description} onChange={e => setNewEvent({ ...newEvent, description: e.target.value })} />
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={handleCreateEvent} className="btn btn-primary">Create</button>
            <button onClick={() => setShowCreate(false)} className="btn btn-ghost">Cancel</button>
          </div>
        </div>
      )}

      {error && (
        <div className="card mb-4" style={{ borderColor: 'var(--danger)' }}>
          <p className="text-sm" style={{ color: 'var(--danger)' }}>{error}</p>
        </div>
      )}

      {/* Mobile: day selector tabs + single day view */}
      <div className="md:hidden">
        <div className="flex gap-1 mb-3 overflow-x-auto">
          {days.map((day, i) => {
            const isToday = isSameDay(day, new Date());
            const dayEvents = getEventsForDay(day);
            return (
              <button
                key={day.toISOString()}
                onClick={() => setActiveDayIndex(i)}
                className="flex-1 min-w-0 py-2 px-1 rounded-lg text-center"
                style={{
                  background: activeDayIndex === i ? 'var(--accent-bg)' : isToday ? 'rgba(99, 102, 241, 0.05)' : 'var(--bg-card)',
                  border: activeDayIndex === i ? '1.5px solid var(--accent)' : '1.5px solid var(--border)',
                }}
              >
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{format(day, 'EEE')}</p>
                <p className="text-sm font-bold" style={{ color: activeDayIndex === i ? 'var(--accent)' : 'var(--text)' }}>{format(day, 'd')}</p>
                {dayEvents.length > 0 && (
                  <div className="w-1.5 h-1.5 rounded-full mx-auto mt-1" style={{ background: 'var(--accent)' }} />
                )}
              </button>
            );
          })}
        </div>

        {/* Active day events */}
        {(() => {
          const day = days[activeDayIndex];
          if (!day) return null;
          const dayEvents = getEventsForDay(day);
          return (
            <div className="card" style={{ minHeight: '200px' }}>
              <h3 className="font-semibold mb-3">{format(day, 'EEEE, MMMM d')}</h3>
              {dayEvents.length === 0 ? (
                <p className="text-sm text-center py-8" style={{ color: 'var(--text-muted)' }}>No events</p>
              ) : (
                <div className="space-y-2">
                  {dayEvents.map(event => {
                    const start = event.start?.dateTime;
                    const end = event.end?.dateTime;
                    return (
                      <div key={event.id} className="p-3 rounded-lg" style={{ background: 'var(--bg)', borderLeft: '3px solid var(--accent)' }}>
                        <p className="text-sm font-medium">{event.summary}</p>
                        {start && (
                          <p className="flex items-center gap-1.5 mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                            <Clock size={12} />
                            {format(new Date(start), 'h:mm a')}{end && ` — ${format(new Date(end), 'h:mm a')}`}
                          </p>
                        )}
                        {event.location && (
                          <p className="flex items-center gap-1.5 mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                            <MapPin size={12} /> {event.location}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* Desktop: 7-column week grid */}
      <div className="hidden md:grid grid-cols-7 gap-2">
        {days.map(day => {
          const dayEvents = getEventsForDay(day);
          const isToday = isSameDay(day, new Date());
          return (
            <div key={day.toISOString()} className="rounded-xl p-3 min-h-[300px]" style={{
              background: isToday ? 'rgba(99, 102, 241, 0.05)' : 'var(--bg-card)',
              border: `1px solid ${isToday ? 'var(--accent)' : 'var(--border)'}`
            }}>
              <div className="text-center mb-3">
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{format(day, 'EEE')}</p>
                <p className="text-lg font-bold" style={{ color: isToday ? 'var(--accent)' : 'var(--text)' }}>
                  {format(day, 'd')}
                </p>
              </div>
              <div className="space-y-1.5">
                {dayEvents.map(event => {
                  const start = event.start?.dateTime;
                  return (
                    <div key={event.id} className="p-2 rounded-lg text-xs" style={{ background: 'var(--bg)', borderLeft: '2px solid var(--accent)' }}>
                      <p className="font-medium truncate">{event.summary}</p>
                      {start && (
                        <p className="flex items-center gap-1 mt-0.5" style={{ color: 'var(--text-muted)' }}>
                          <Clock size={10} /> {format(new Date(start), 'h:mm a')}
                        </p>
                      )}
                      {event.location && (
                        <p className="flex items-center gap-1 mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>
                          <MapPin size={10} /> {event.location}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Page() {
  return <AppShell><CalendarPage /></AppShell>;
}
