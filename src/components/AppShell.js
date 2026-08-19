'use client';

import { useAuth } from '@/lib/auth-context';
import TopNav from './TopNav';
import QuickAdd from './QuickAdd';
import MoodFAB from './MoodFAB';
import { LogIn, Apple, Loader2 } from 'lucide-react';
import KeelMark from './KeelMark';
import Aurora from './Aurora';
import { useState, useCallback, useEffect } from 'react';

export default function AppShell({ children }) {
  const { user, loading, signInWithGoogle, signInWithApple, signInWithEmail } = useAuth();
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [reviewMode, setReviewMode] = useState(false);
  const [reviewEmail, setReviewEmail] = useState('');
  const [reviewPassword, setReviewPassword] = useState('');
  const [reviewError, setReviewError] = useState(null);
  const [reviewLoading, setReviewLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('review') === '1') {
      setReviewMode(true);
    }
  }, []);

  const handleReviewSignIn = async (e) => {
    e.preventDefault();
    if (!reviewEmail || !reviewPassword) return;
    setReviewLoading(true);
    setReviewError(null);
    const error = await signInWithEmail(reviewEmail, reviewPassword);
    if (error) setReviewError(error.message || 'Sign-in failed');
    setReviewLoading(false);
  };

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
          <KeelMark size={32} bg="var(--accent)" color="#ffffff" />
          <span className="text-lg" style={{ color: 'var(--text-muted)' }}>Loading Keel…</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' }}>
        <div className="text-center animate-in">
          <div className="flex justify-center mb-6">
            <KeelMark size={80} bg="#ffffff" color="#172554" />
          </div>
          <h1 className="text-3xl font-bold mb-2 text-white" style={{ letterSpacing: '-0.02em' }}>Keel</h1>
          <p className="mb-1 text-lg" style={{ color: '#94a3b8' }}>
            What keeps you steady
          </p>
          <p className="mb-8 text-sm" style={{ color: '#64748b' }}>
            Tasks, calendar, and health protocols in one place
          </p>

          <div className="flex flex-col items-center gap-3">
            <button
              onClick={signInWithGoogle}
              className="inline-flex items-center justify-center gap-3 px-8 py-3.5 rounded-xl text-base font-medium text-white transition-all w-64"
              style={{ background: 'var(--accent)', boxShadow: '0 4px 12px rgba(99,102,241,0.4)' }}
            >
              <LogIn size={20} />
              Sign in with Google
            </button>
            <button
              onClick={signInWithApple}
              className="inline-flex items-center justify-center gap-3 px-8 py-3.5 rounded-xl text-base font-medium text-white transition-all w-64"
              style={{ background: '#000', boxShadow: '0 4px 12px rgba(0,0,0,0.4)' }}
            >
              <Apple size={20} />
              Sign in with Apple
            </button>

            {reviewMode && (
              <form onSubmit={handleReviewSignIn} className="flex flex-col gap-2 mt-2 w-64">
                <p className="text-xs text-center" style={{ color: '#94a3b8' }}>App Store review sign-in</p>
                <input
                  type="email"
                  value={reviewEmail}
                  onChange={e => setReviewEmail(e.target.value)}
                  placeholder="Email"
                  autoComplete="email"
                  className="px-3 py-2 rounded-lg text-sm"
                  style={{ background: '#1e293b', border: '1px solid #334155', color: 'white' }}
                />
                <input
                  type="password"
                  value={reviewPassword}
                  onChange={e => setReviewPassword(e.target.value)}
                  placeholder="Password"
                  autoComplete="current-password"
                  className="px-3 py-2 rounded-lg text-sm"
                  style={{ background: '#1e293b', border: '1px solid #334155', color: 'white' }}
                />
                {reviewError && <p className="text-xs text-center" style={{ color: '#ef4444' }}>{reviewError}</p>}
                <button
                  type="submit"
                  disabled={reviewLoading || !reviewEmail || !reviewPassword}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-white flex items-center justify-center gap-2"
                  style={{ background: '#475569', opacity: reviewLoading || !reviewEmail || !reviewPassword ? 0.6 : 1 }}
                >
                  {reviewLoading && <Loader2 size={14} className="animate-spin" />}
                  Sign in
                </button>
              </form>
            )}
          </div>

          <div className="mt-14 grid grid-cols-3 gap-8 max-w-md mx-auto">
            {[
              { emoji: '🎯', label: 'Tasks & Priorities' },
              { emoji: '🧬', label: 'Health Protocol' },
              { emoji: '📥', label: 'Inbox → Tasks' },
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
      <Aurora />
      <TopNav onQuickAdd={() => setQuickAddOpen(true)} />
      <main className="app-main" style={{ position: 'relative', zIndex: 1 }}>
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
