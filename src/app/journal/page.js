'use client';

import AppShell from '@/components/AppShell';
import { useAuth } from '@/lib/auth-context';
import { getSupabase } from '@/lib/supabase-browser';
import { useState, useEffect, useCallback, useRef } from 'react';
import { BookOpen, ChevronLeft, ChevronRight, Star, Calendar, Check, Mic } from 'lucide-react';
import VoiceMic from '@/components/VoiceMic';
import { useMoodEntries } from '@/lib/hooks';
import { format, addDays, subDays, isToday, parseISO } from 'date-fns';

const MOODS = [
  { value: 'great', emoji: '😄', label: 'Great' },
  { value: 'good', emoji: '🙂', label: 'Good' },
  { value: 'okay', emoji: '😐', label: 'Okay' },
  { value: 'tough', emoji: '😔', label: 'Tough' },
  { value: 'bad', emoji: '😞', label: 'Bad' },
];

const SECTIONS = [
  { key: 'morning_intentions', icon: '🌅', title: 'Morning Intentions', placeholder: 'What are the 3 most important things today?', rows: 3 },
  { key: 'gratitude', icon: '🙏', title: 'Gratitude', placeholder: 'What are you grateful for?', rows: 2 },
  { key: 'reflections', icon: '🧠', title: 'Reflections', placeholder: 'Free-form thoughts, observations, ideas...', rows: 4 },
  { key: 'wins', icon: '🏆', title: 'Wins', placeholder: 'What went well today?', rows: 2 },
  { key: 'lessons', icon: '📈', title: 'Lessons', placeholder: 'What did you learn?', rows: 2 },
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
  const [showRecent, setShowRecent] = useState(false);

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

  // Load recent entries
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

    if (result.data) setEntry(result.data);
    if (result.error) console.error('Journal save error:', result.error);

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
  const selectedMood = moodForValue(mood);

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
    <div className="max-w-2xl mx-auto animate-in">
      {/* Compact Header with date nav */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--text)' }}>
          <BookOpen size={22} style={{ color: 'var(--accent)' }} />
          Journal
        </h1>
        <div className="flex items-center gap-1">
          {saving && (
            <span className="text-xs px-2 py-1 rounded mr-2" style={{ color: 'var(--text-muted)' }}>
              Saving...
            </span>
          )}
          {saved && !saving && (
            <span className="text-xs px-2 py-1 rounded flex items-center gap-1 mr-2" style={{ color: 'var(--success)' }}>
              <Check size={12} /> Saved
            </span>
          )}
          {recentEntries.length > 0 && (
            <button
              onClick={() => setShowRecent(!showRecent)}
              className="btn btn-ghost text-xs"
              style={{ padding: '6px 10px' }}
            >
              <Calendar size={14} />
              History
            </button>
          )}
        </div>
      </div>

      {/* Date Navigation — clean inline bar */}
      <div className="flex items-center justify-between mb-5 px-1">
        <button onClick={goToPrevDay} className="p-1.5 rounded-lg" style={{ color: 'var(--text-muted)' }}>
          <ChevronLeft size={20} />
        </button>
        <div className="text-center">
          <p className="font-semibold" style={{ color: 'var(--text)' }}>
            {format(currentDate, 'EEEE, MMM d')}
          </p>
          {!isToday(currentDate) && (
            <button onClick={goToToday} className="text-xs" style={{ color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}>
              Back to today
            </button>
          )}
        </div>
        <button onClick={goToNextDay} className="p-1.5 rounded-lg" style={{ color: 'var(--text-muted)' }}>
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Recent Entries — collapsible panel */}
      {showRecent && recentEntries.length > 0 && (
        <div className="mb-5 rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)', background: 'var(--bg-card)' }}>
          {recentEntries.map((re, i) => {
            const reMood = moodForValue(re.mood);
            const reParsed = parseContent(re.content);
            return (
              <button
                key={re.id}
                onClick={() => { setCurrentDate(parseISO(re.date)); setShowRecent(false); }}
                className="w-full flex items-center justify-between px-4 py-3 text-left transition-colors"
                style={{
                  borderTop: i > 0 ? '1px solid var(--border)' : 'none',
                  color: 'var(--text)',
                }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{reMood?.emoji || '📝'}</span>
                  <div>
                    <p className="text-sm font-medium">{format(parseISO(re.date), 'EEE, MMM d')}</p>
                    {reMood && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Feeling {reMood.label.toLowerCase()}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-0.5">
                  {reParsed.rating > 0 && Array.from({ length: reParsed.rating }).map((_, i) => (
                    <Star key={i} size={12} fill="#f59e0b" color="#f59e0b" />
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Mood + Rating — single compact row */}
      <div className="card mb-4" style={{ padding: '16px 20px' }}>
        <div className="flex items-center gap-6 flex-wrap">
          {/* Mood pills */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium mr-1" style={{ color: 'var(--text-muted)' }}>Mood</span>
            {MOODS.map(m => (
              <button
                key={m.value}
                onClick={() => handleMoodChange(m.value)}
                title={m.label}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  fontSize: '1.1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: mood === m.value ? '2px solid var(--accent)' : '2px solid transparent',
                  background: mood === m.value ? 'var(--accent-bg)' : 'transparent',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {m.emoji}
              </button>
            ))}
          </div>

          {/* Divider */}
          <div style={{ width: 1, height: 28, background: 'var(--border)' }} />

          {/* Star rating inline */}
          <div className="flex items-center gap-1">
            <span className="text-xs font-medium mr-1" style={{ color: 'var(--text-muted)' }}>Day</span>
            {[1, 2, 3, 4, 5].map(n => (
              <button
                key={n}
                onClick={() => handleRatingChange(n)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 2,
                  transition: 'transform 0.15s',
                  transform: rating >= n ? 'scale(1.05)' : 'scale(1)',
                  lineHeight: 1,
                }}
              >
                <Star
                  size={22}
                  fill={rating >= n ? '#f59e0b' : 'none'}
                  color={rating >= n ? '#f59e0b' : 'var(--border)'}
                  strokeWidth={1.5}
                />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Journal Sections — clean minimal cards */}
      {SECTIONS.map(section => (
        <div key={section.key} className="mb-3">
          <div className="flex items-center justify-between mb-1.5 px-1">
            <label className="text-sm font-medium flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
              <span>{section.icon}</span>
              {section.title}
            </label>
            <VoiceMic
              onAppend={(t) => handleContentChange(section.key, (content[section.key] || '') + (content[section.key] ? ' ' : '') + t)}
              mode="append"
              size={14}
            />
          </div>
          <textarea
            className="input"
            rows={section.rows}
            placeholder={section.placeholder}
            value={content[section.key] || ''}
            onChange={e => handleContentChange(section.key, e.target.value)}
            style={{ resize: 'vertical', width: '100%', background: 'var(--bg-card)', borderRadius: 10 }}
          />
        </div>
      ))}
    </div>
  );
}

export default function Page() {
  return <AppShell><JournalPage /></AppShell>;
}
