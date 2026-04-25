'use client';

import { useState } from 'react';
import { X, Zap } from 'lucide-react';
import VoiceMic from './VoiceMic';
import { createMoodEntry } from '@/lib/hooks';
import { hapticSuccess } from '@/lib/native';

const MOODS = [
  { value: 1, emoji: '😫', label: 'Awful' },
  { value: 2, emoji: '😔', label: 'Low' },
  { value: 3, emoji: '😐', label: 'Okay' },
  { value: 4, emoji: '🙂', label: 'Good' },
  { value: 5, emoji: '😊', label: 'Great' },
];

const ENERGY = [
  { value: 1, label: '🔋', desc: 'Drained' },
  { value: 2, label: '🪫', desc: 'Low' },
  { value: 3, label: '⚡', desc: 'Normal' },
  { value: 4, label: '💪', desc: 'High' },
  { value: 5, label: '🔥', desc: 'Fired up' },
];

const TAGS = ['work', 'health', 'family', 'social', 'rest', 'stress', 'exercise', 'learning'];

export default function MoodFAB() {
  const [open, setOpen] = useState(false);
  const [mood, setMood] = useState(null);
  const [energy, setEnergy] = useState(null);
  const [note, setNote] = useState('');
  const [tags, setTags] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const reset = () => {
    setMood(null);
    setEnergy(null);
    setNote('');
    setTags([]);
    setSaved(false);
  };

  const handleOpen = () => {
    reset();
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    reset();
  };

  const toggleTag = (tag) => {
    setTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const handleSave = async () => {
    if (!mood) return;
    setSaving(true);
    try {
      const selected = MOODS.find(m => m.value === mood);
      await createMoodEntry({
        mood,
        emoji: selected.emoji,
        energy: energy || null,
        note: note.trim() || null,
        tags: tags.length > 0 ? tags : [],
      });
      hapticSuccess();
      setSaved(true);
      setTimeout(() => {
        handleClose();
      }, 800);
    } catch (err) {
      console.error('Failed to save mood:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {/* FAB Button */}
      <button
        onClick={handleOpen}
        className="fixed z-30 rounded-full flex items-center justify-center"
        style={{
          bottom: 'calc(80px + env(safe-area-inset-bottom, 0px))',
          right: '16px',
          width: '48px',
          height: '48px',
          background: 'var(--accent)',
          color: 'white',
          boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)',
          border: 'none',
          cursor: 'pointer',
          fontSize: '1.25rem',
          transition: 'transform 0.15s, box-shadow 0.15s',
        }}
        title="How are you feeling?"
      >
        😊
      </button>

      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
          style={{ background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)' }}
          onClick={handleClose}
        >
          <div
            className="w-full md:w-auto md:min-w-[400px] md:max-w-[440px] md:rounded-2xl rounded-t-2xl animate-in"
            style={{
              background: 'var(--bg-card)',
              boxShadow: '0 -4px 20px rgba(0,0,0,0.1)',
              maxHeight: '85vh',
              overflowY: 'auto',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-4 pb-2">
              <h3 className="text-base font-semibold" style={{ color: 'var(--text)' }}>
                How are you feeling?
              </h3>
              <button onClick={handleClose} className="p-1.5 rounded-lg" style={{ color: 'var(--text-muted)' }}>
                <X size={18} />
              </button>
            </div>

            {/* Mood selector */}
            <div className="flex justify-center gap-2 px-5 py-4">
              {MOODS.map(m => (
                <button
                  key={m.value}
                  onClick={() => setMood(m.value)}
                  className="flex flex-col items-center gap-1.5 rounded-xl transition-all"
                  style={{
                    padding: '12px 14px',
                    background: mood === m.value ? 'var(--accent-bg)' : 'var(--bg)',
                    border: mood === m.value ? '2px solid var(--accent)' : '2px solid transparent',
                    cursor: 'pointer',
                    transform: mood === m.value ? 'scale(1.08)' : 'scale(1)',
                  }}
                >
                  <span style={{ fontSize: '1.75rem' }}>{m.emoji}</span>
                  <span className="text-xs font-medium" style={{ color: mood === m.value ? 'var(--accent)' : 'var(--text-muted)' }}>
                    {m.label}
                  </span>
                </button>
              ))}
            </div>

            {/* Energy level — only show after mood selected */}
            {mood && (
              <div className="px-5 pb-3">
                <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Energy level</p>
                <div className="flex gap-1.5">
                  {ENERGY.map(e => (
                    <button
                      key={e.value}
                      onClick={() => setEnergy(e.value)}
                      className="flex-1 py-2 rounded-lg text-center transition-all"
                      style={{
                        background: energy === e.value ? 'var(--accent-bg)' : 'var(--bg)',
                        border: energy === e.value ? '1.5px solid var(--accent)' : '1.5px solid var(--border)',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                      }}
                      title={e.desc}
                    >
                      {e.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Note + voice */}
            {mood && (
              <div className="px-5 pb-3">
                <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>What&apos;s on your mind? (optional)</p>
                <div className="flex items-start gap-2">
                  <textarea
                    className="input flex-1"
                    rows={2}
                    placeholder="Quick note..."
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    style={{ resize: 'none', fontSize: '0.875rem' }}
                  />
                  <VoiceMic onResult={(t) => setNote(t)} size={16} />
                </div>
              </div>
            )}

            {/* Tags */}
            {mood && (
              <div className="px-5 pb-3">
                <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Tags (optional)</p>
                <div className="flex flex-wrap gap-1.5">
                  {TAGS.map(tag => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                      style={{
                        background: tags.includes(tag) ? 'var(--accent-bg)' : 'var(--bg)',
                        color: tags.includes(tag) ? 'var(--accent)' : 'var(--text-muted)',
                        border: tags.includes(tag) ? '1px solid var(--accent-light)' : '1px solid var(--border)',
                        cursor: 'pointer',
                      }}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Save button */}
            <div className="px-5 pb-5 pt-2">
              <button
                onClick={handleSave}
                disabled={!mood || saving}
                className="btn btn-primary w-full justify-center py-3"
                style={{ opacity: !mood || saving ? 0.5 : 1 }}
              >
                {saved ? '✓ Saved!' : saving ? 'Saving...' : 'Log Feeling'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
