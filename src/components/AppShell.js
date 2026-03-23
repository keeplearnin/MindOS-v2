'use client';

import { useAuth } from '@/lib/auth-context';
import TopNav from './TopNav';
import QuickAdd from './QuickAdd';
import MoodFAB from './MoodFAB';
import { Brain, LogIn } from 'lucide-react';
import { useState, useCallback } from 'react';

export default function AppShell({ children }) {
  const { user, loading, signInWithGoogle } = useAuth();
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  const handleQuickAddClose = useCallback((action) => {
    if (action === 'toggle') {
      setQuickAddOpen(prev => !prev);
    } else {
      setQuickAddOpen(false);
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="animate-pulse flex items-center gap-3">
          <Brain size={32} style={{ color: 'var(--accent)' }} />
          <span className="text-lg" style={{ color: 'var(--text-muted)' }}>Loading MindOS...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' }}>
        <div className="text-center animate-in">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{ background: '#3b82f6', boxShadow: '0 8px 24px rgba(59,130,246,0.3)' }}>
            <Brain size={40} color="white" />
          </div>
          <h1 className="text-3xl font-bold mb-2 text-white">MindOS</h1>
          <p className="mb-1 text-lg" style={{ color: '#94a3b8' }}>
            7 Habits + Getting Things Done
          </p>
          <p className="mb-8 text-sm" style={{ color: '#64748b' }}>
            Your productivity operating system with Gmail & Calendar integration
          </p>

          <button
            onClick={signInWithGoogle}
            className="inline-flex items-center gap-3 px-8 py-3.5 rounded-xl text-base font-medium text-white transition-all"
            style={{ background: '#3b82f6', boxShadow: '0 4px 12px rgba(59,130,246,0.4)' }}
          >
            <LogIn size={20} />
            Sign in with Google
          </button>

          <div className="mt-14 grid grid-cols-3 gap-8 max-w-md mx-auto">
            {[
              { emoji: '🎯', label: 'Eisenhower Matrix' },
              { emoji: '📥', label: 'GTD Inbox Processing' },
              { emoji: '📧', label: 'Email → Tasks' },
            ].map(item => (
              <div key={item.label} className="text-center">
                <div className="text-2xl mb-2">{item.emoji}</div>
                <p className="text-xs" style={{ color: '#64748b' }}>{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <TopNav onQuickAdd={() => setQuickAddOpen(true)} />
      <main className="app-main">
        {children}
      </main>
      <QuickAdd
        open={quickAddOpen}
        onClose={handleQuickAddClose}
      />
      <MoodFAB />
    </div>
  );
}
