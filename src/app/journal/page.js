'use client';

import AppShell from '@/components/AppShell';
import { useAuth } from '@/lib/auth-context';
import { getSupabase } from '@/lib/supabase-browser';
import { useState, useEffect, useCallback, useRef } from 'react';
import { BookOpen, ChevronLeft, ChevronRight, Star, Calendar, Check } from 'lucide-react';
import { format, addDays, subDays, isToday, parseISO } from 'date-fns';

const MOODS = [
  { value: 'great', emoji: '😄', label: 'Great' },
  { value: 'good', emoji: '🙂', label: 'Good' },
  { value: 'okay', emoji: '😐', label: 'Okay' },
  { value: 'tough', emoji: '😔', label: 'Tough' },
  { value: 'bad', emoji: '😞', label: 'Bad' },
];

const SECTIONS = [
  { key: 'morning_intentions', icon: '🌅', title: 'Morning Intentions', placeholder: 'What are the 3 most important things today?', rows: 4 },
  { key: 'gratitude', icon: '🙏', title: 'Gratitude', placeholder: 'What are you grateful for?', rows: 3 },
  { key: 'reflections', icon: '🧠', title: 'Reflections', placeholder: 'Free-form thoughts, observations, ideas...', rows: 5 },
  { key: 'wins', icon: '🏆', title: 'Wins', placeholder: 'What went well today?', rows: 3 },
  { key: 'lessons', icon: '📈', title: 'Lessons', placeholder: 'What did you learn?', rows: 3 },
];

const EMPTY_CONTENT = {
  morning_intentions: '',
  gratitude: '',
  reflections: '',
  wins: '',
  lessons: '',
};

function parseContent(raw) {
  if (!raw) return { ...EMPTY_CONTENT, rating: 0 };
  try {
    const parsed = JSON.parse(raw);
    return { ...EMPTY_CONTENT, rating: 0, ...parsed };
  } catch {
    // Legacy plain text — put it in reflections
    return { ...EMPTY_CONTENT, rating: 0, reflections: raw };
  }
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

function JournalPage() {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [entry, setEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [recentEntries, setRecentEntries] = useState([]);
  const [content, setContent] = useState({ ...EMPTY_CONTENT });
  const [mood, setMood] = useState(null);
  const [rating, setRating] = useState(0);

  const dateStr = format(currentDate, 'yyyy-MM-dd');

  // Load entry for current date
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', dateStr)
        .single();

      if (data && !error) {
        setEntry(data);
        const parsed = parseContent(data.content);
        setContent({ morning_intentions: parsed.morning_intentions, gratitude: parsed.gratitude, reflections: parsed.reflections, wins: parsed.wins, lessons: parsed.lessons });
        setMood(data.mood);
        setRating(parsed.rating || 0);
      } else {
        setEntry(null);
        setContent({ ...EMPTY_CONTENT });
        setMood(null);
        setRating(0);
      }
      setLoading(false);
    };
    load();
  }, [user, dateStr]);

  // Load recent entries (last 7 days excluding current)
  useEffect(() => {
    if (!user) return;
    const loadRecent = async () => {
      const supabase = getSupabase();
      const sevenDaysAgo = format(subDays(currentDate, 7), 'yyyy-MM-dd');
      const { data } = await supabase
        .from('journal_entries')
        .select('id, date, mood, content')
        .eq('user_id', user.id)
        .gte('date', sevenDaysAgo)
        .neq('date', dateStr)
        .order('date', { ascending: false })
        .limit(7);
      setRecentEntries(data || []);
    };
    loadRecent();
  }, [user, dateStr, currentDate]);

  // Save to Supabase
  const saveEntry = useCallback(async (updates) => {
    if (!user) return;
    setSaving(true);

    const supabase = getSupabase();
    const currentContent = updates.content !== undefined ? updates.content : content;
    const currentRating = updates.rating !== undefined ? updates.rating : rating;
    const currentMood = updates.mood !== undefined ? updates.mood : mood;

    // Store everything as JSON string in the text column
    const contentJson = JSON.stringify({
      ...currentContent,
      rating: currentRating,
    });

    const payload = {
      user_id: user.id,
      date: dateStr,
      content: contentJson,
      mood: currentMood,
      updated_at: new Date().toISOString(),
    };

    let result;
    if (entry?.id) {
      result = await supabase
        .from('journal_entries')
        .update(payload)
        .eq('id', entry.id)
        .select()
        .single();
    } else {
      result = await supabase
        .from('journal_entries')
        .insert(payload)
        .select()
        .single();
    }

    if (result.data) {
      setEntry(result.data);
    }
    if (result.error) {
      console.error('Journal save error:', result.error);
    }

    setSaving(false);
    if (!result.error) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  }, [user, dateStr, entry, content, mood, rating]);

  const debouncedSave = useDebounce(saveEntry, 800);

  const handleContentChange = (key, value) => {
    const updated = { ...content, [key]: value };
    setContent(updated);
    debouncedSave({ content: updated });
  };

  const handleMoodChange = (value) => {
    setMood(value);
    saveEntry({ mood: value });
  };

  const handleRatingChange = (value) => {
    setRating(value);
    saveEntry({ rating: value });
  };

  const goToPrevDay = () => setCurrentDate(prev => subDays(prev, 1));
  const goToNextDay = () => setCurrentDate(prev => addDays(prev, 1));
  const goToToday = () => setCurrentDate(new Date());

  const moodForValue = (val) => MOODS.find(m => m.value === val);

  if (loading) {
    return (
      <AppShell>
        <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
          Loading journal...
        </div>
      </AppShell>
    );
  }

  return (
    <div className="max-w-3xl animate-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen size={24} style={{ color: 'var(--accent)' }} />
            Daily Journal
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Habit 7: Sharpen the Saw — Reflect, renew, grow
          </p>
        </div>
        {saving && (
          <span className="text-xs px-2 py-1 rounded" style={{ color: 'var(--text-muted)', background: 'var(--surface)' }}>
            Saving...
          </span>
        )}
        {saved && !saving && (
          <span className="text-xs px-2 py-1 rounded flex items-center gap-1" style={{ color: '#22c55e', background: '#22c55e15' }}>
            <Check size={12} /> Saved
          </span>
        )}
      </div>

      {/* Date Navigation */}
      <div className="card mb-6" style={{ padding: '12px 16px' }}>
        <div className="flex items-center justify-between">
          <button onClick={goToPrevDay} className="btn btn-ghost" style={{ padding: '6px' }}>
            <ChevronLeft size={20} />
          </button>
          <div className="text-center">
            <p className="font-semibold text-lg" style={{ color: 'var(--text)' }}>
              {format(currentDate, 'EEEE, MMMM d, yyyy')}
            </p>
            {isToday(currentDate) ? (
              <span className="text-xs font-medium" style={{ color: 'var(--accent)' }}>Today</span>
            ) : (
              <button onClick={goToToday} className="text-xs font-medium" style={{ color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}>
                Jump to Today
              </button>
            )}
          </div>
          <button onClick={goToNextDay} className="btn btn-ghost" style={{ padding: '6px' }}>
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Mood Selector */}
      <div className="card mb-4">
        <p className="text-sm font-medium mb-3" style={{ color: 'var(--text)' }}>
          How are you feeling?
        </p>
        <div className="flex gap-2 justify-center">
          {MOODS.map(m => (
            <button
              key={m.value}
              onClick={() => handleMoodChange(m.value)}
              className="flex flex-col items-center gap-1 rounded-xl transition-all"
              style={{
                padding: '10px 16px',
                background: mood === m.value ? 'var(--accent)15' : 'var(--surface)',
                border: mood === m.value ? '2px solid var(--accent)' : '2px solid transparent',
                cursor: 'pointer',
              }}
            >
              <span className="text-2xl">{m.emoji}</span>
              <span className="text-xs" style={{ color: mood === m.value ? 'var(--accent)' : 'var(--text-muted)' }}>
                {m.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Day Rating */}
      <div className="card mb-4">
        <p className="text-sm font-medium mb-3" style={{ color: 'var(--text)' }}>
          Rate your day
        </p>
        <div className="flex gap-1 justify-center">
          {[1, 2, 3, 4, 5].map(n => (
            <button
              key={n}
              onClick={() => handleRatingChange(n)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                transition: 'transform 0.15s',
                transform: rating >= n ? 'scale(1.1)' : 'scale(1)',
              }}
            >
              <Star
                size={32}
                fill={rating >= n ? '#f59e0b' : 'none'}
                color={rating >= n ? '#f59e0b' : 'var(--border)'}
                strokeWidth={1.5}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Journal Sections */}
      {SECTIONS.map(section => (
        <div key={section.key} className="card mb-4">
          <p className="text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>
            {section.icon} {section.title}
          </p>
          <textarea
            className="input"
            rows={section.rows}
            placeholder={section.placeholder}
            value={content[section.key] || ''}
            onChange={e => handleContentChange(section.key, e.target.value)}
            style={{ resize: 'vertical', width: '100%' }}
          />
        </div>
      ))}

      {/* Recent Entries */}
      {recentEntries.length > 0 && (
        <div className="mt-8 mb-4">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--text)' }}>
            <Calendar size={18} style={{ color: 'var(--accent)' }} />
            Recent Entries
          </h2>
          <div className="space-y-2">
            {recentEntries.map(re => {
              const reMood = moodForValue(re.mood);
              const reParsed = parseContent(re.content);
              return (
                <button
                  key={re.id}
                  onClick={() => setCurrentDate(parseISO(re.date))}
                  className="card w-full text-left flex items-center justify-between transition-all"
                  style={{ padding: '12px 16px', cursor: 'pointer', border: '1px solid var(--border)' }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{reMood?.emoji || '📝'}</span>
                    <div>
                      <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                        {format(parseISO(re.date), 'EEE, MMM d')}
                      </p>
                      {reMood && (
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          Feeling {reMood.label.toLowerCase()}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {reParsed.rating > 0 && Array.from({ length: reParsed.rating }).map((_, i) => (
                      <Star key={i} size={14} fill="#f59e0b" color="#f59e0b" />
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Page() {
  return <AppShell><JournalPage /></AppShell>;
}
