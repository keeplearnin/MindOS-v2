'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff } from 'lucide-react';

/**
 * useVoiceInput hook — reusable voice-to-text for any input.
 *
 * Usage:
 *   const { isListening, speechSupported, toggleVoice, stopListening } = useVoiceInput({
 *     onResult: (transcript) => setText(transcript),
 *     onAppend: (transcript) => setText(prev => prev + ' ' + transcript),
 *     mode: 'replace' | 'append',  // default 'replace'
 *   });
 */
export function useVoiceInput({ onResult, onAppend, mode = 'replace' } = {}) {
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SR = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);
    setSpeechSupported(!!SR);
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.abort();
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  const toggleVoice = useCallback(() => {
    if (isListening) {
      stopListening();
      return;
    }

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;

    const recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map(r => r[0].transcript)
        .join('');
      if (mode === 'append' && onAppend) {
        onAppend(transcript);
      } else if (onResult) {
        onResult(transcript);
      }
    };

    recognition.onerror = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [isListening, stopListening, onResult, onAppend, mode]);

  useEffect(() => {
    return () => stopListening();
  }, [stopListening]);

  return { isListening, speechSupported, toggleVoice, stopListening };
}

/**
 * VoiceMic button — drop-in mic button for any input.
 *
 * Usage:
 *   <div className="flex items-center gap-2">
 *     <input value={text} onChange={e => setText(e.target.value)} />
 *     <VoiceMic onResult={(t) => setText(t)} />
 *   </div>
 */
export default function VoiceMic({ onResult, onAppend, mode = 'replace', size = 18, className = '' }) {
  const { isListening, speechSupported, toggleVoice } = useVoiceInput({ onResult, onAppend, mode });

  if (!speechSupported) return null;

  return (
    <>
      <style>{`
        @keyframes voice-mic-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.3); }
          50% { box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); }
        }
      `}</style>
      <button
        type="button"
        onClick={toggleVoice}
        className={`voice-btn ${isListening ? 'listening' : ''} ${className}`}
        style={{
          width: size + 18,
          height: size + 18,
          animation: isListening ? 'voice-mic-pulse 1.5s infinite' : 'none',
        }}
        title={isListening ? 'Stop listening' : 'Voice input'}
      >
        {isListening ? <MicOff size={size} /> : <Mic size={size} />}
      </button>
    </>
  );
}
