'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Zap, Calendar, Flag, Hash, ArrowRight, Mic, MicOff } from 'lucide-react';
import { createTask } from '@/lib/hooks';

export default function QuickAdd({ open, onClose, onCreated }) {
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState('next_action');
  const [quadrant, setQuadrant] = useState(2);
  const [dueDate, setDueDate] = useState('');
  const [showMore, setShowMore] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);

  // Check for Speech API support on mount
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setSpeechSupported(!!SpeechRecognition);
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.abort();
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  const toggleVoiceInput = useCallback(() => {
    if (isListening) {
      stopListening();
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map(result => result[0].transcript)
        .join('');
      setTitle(transcript);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
      inputRef.current?.focus();
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [isListening, stopListening]);

  // Clean up recognition on unmount
  useEffect(() => {
    return () => stopListening();
  }, [stopListening]);

  useEffect(() => {
    if (open) {
      setTitle('');
      setStatus('next_action');
      setQuadrant(2);
      setDueDate('');
      setShowMore(false);
      stopListening();
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open, stopListening]);

  // Keyboard shortcut: Cmd+K to open
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (open) onClose();
        else onClose('toggle');
      }
      if (e.key === 'Escape' && open) onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || saving) return;
    setSaving(true);
    try {
      const data = {
        title: title.trim(),
        status,
        quadrant,
        due_date: dueDate || null,
      };
      await createTask(data);
      onCreated?.();
      onClose();
    } catch (err) {
      console.error('Failed to create task:', err);
    }
    setSaving(false);
  };

  const quadrants = [
    { v: 1, label: 'Q1', color: 'var(--q1)', desc: 'Urgent + Important' },
    { v: 2, label: 'Q2', color: 'var(--q2)', desc: 'Important' },
    { v: 3, label: 'Q3', color: 'var(--q3)', desc: 'Urgent' },
    { v: 4, label: 'Q4', color: 'var(--q4)', desc: 'Neither' },
  ];

  return (
    <>
    <style>{`
      @keyframes voice-pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.4; }
      }
    `}</style>
    <div className="quick-add-overlay" onClick={onClose}>
      <div className="quick-add-dialog animate-in" onClick={e => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          {/* Main input */}
          <div className="flex items-center gap-3 px-5 py-4">
            <Zap size={18} style={{ color: 'var(--accent)', flexShrink: 0 }} />
            <input
              ref={inputRef}
              type="text"
              className="flex-1 bg-transparent border-none outline-none text-base"
              style={{ color: 'var(--text)' }}
              placeholder="What needs to be done?"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
            {speechSupported && (
              <button
                type="button"
                onClick={toggleVoiceInput}
                className="voice-btn"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: isListening ? '#ef4444' : 'var(--text-muted)',
                  animation: isListening ? 'voice-pulse 1.5s ease-in-out infinite' : 'none',
                  position: 'relative',
                }}
                title={isListening ? 'Stop listening' : 'Voice input'}
              >
                {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                {isListening && (
                  <span style={{
                    position: 'absolute',
                    inset: '-2px',
                    borderRadius: '8px',
                    border: '2px solid #ef4444',
                    animation: 'voice-pulse 1.5s ease-in-out infinite',
                    pointerEvents: 'none',
                  }} />
                )}
              </button>
            )}
            <kbd className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'var(--bg)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>⌘K</kbd>
          </div>

          {/* Quick options bar */}
          <div className="flex items-center gap-2 px-5 py-3" style={{ borderTop: '1px solid var(--border)' }}>
            {/* Status pills */}
            <div className="flex gap-1">
              {[
                { v: 'next_action', label: 'Action', icon: ArrowRight },
                { v: 'waiting_for', label: 'Waiting', icon: Flag },
                { v: 'someday_maybe', label: 'Someday', icon: Hash },
              ].map(s => (
                <button
                  key={s.v}
                  type="button"
                  className={`quick-pill ${status === s.v ? 'active' : ''}`}
                  onClick={() => setStatus(s.v)}
                >
                  <s.icon size={12} />
                  {s.label}
                </button>
              ))}
            </div>

            <div className="w-px h-5 mx-1" style={{ background: 'var(--border)' }} />

            {/* Quadrant chips */}
            <div className="flex gap-1">
              {quadrants.map(q => (
                <button
                  key={q.v}
                  type="button"
                  className="quick-pill"
                  style={quadrant === q.v ? { background: `${q.color}15`, color: q.color, borderColor: `${q.color}40` } : {}}
                  onClick={() => setQuadrant(q.v)}
                  title={q.desc}
                >
                  {q.label}
                </button>
              ))}
            </div>

            <div className="w-px h-5 mx-1" style={{ background: 'var(--border)' }} />

            {/* Due date */}
            <div className="relative">
              <input
                type="date"
                className="quick-pill cursor-pointer"
                style={dueDate ? { background: 'var(--accent-bg)', color: 'var(--accent)', borderColor: 'var(--accent-light)' } : {}}
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
              />
            </div>

            {/* Submit */}
            <div className="ml-auto">
              <button
                type="submit"
                disabled={!title.trim() || saving}
                className="btn btn-primary text-sm py-1.5 px-4"
              >
                {saving ? 'Adding...' : 'Add'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
    </>
  );
}
