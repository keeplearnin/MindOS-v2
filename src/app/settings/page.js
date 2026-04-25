'use client';

import AppShell from '@/components/AppShell';
import { useAuth } from '@/lib/auth-context';
import { useState } from 'react';
import { AlertTriangle, Loader2, Mail, FileText, Trash2 } from 'lucide-react';
import Link from 'next/link';

export default function SettingsPage() {
  return (
    <AppShell>
      <SettingsContent />
    </AppShell>
  );
}

function SettingsContent() {
  const { user } = useAuth();
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);

  const handleDelete = async () => {
    if (confirmText !== 'DELETE') return;
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch('/api/user/delete', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete account');
      window.location.href = '/';
    } catch (err) {
      setError(err.message);
      setDeleting(false);
    }
  };

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '32px 20px' }}>
      <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--text)' }}>Settings</h1>

      <section className="card mb-4">
        <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-muted)' }}>Account</h2>
        <div className="flex items-center gap-3 mb-2">
          <Mail size={16} style={{ color: 'var(--text-muted)' }} />
          <span style={{ color: 'var(--text)' }}>{user?.email}</span>
        </div>
        {user?.user_metadata?.full_name && (
          <div className="text-sm" style={{ color: 'var(--text-muted)' }}>{user.user_metadata.full_name}</div>
        )}
      </section>

      <section className="card mb-4">
        <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-muted)' }}>Legal</h2>
        <Link href="/privacy" className="flex items-center gap-2 hover:opacity-80" style={{ color: 'var(--accent)' }}>
          <FileText size={16} />
          <span>Privacy Policy</span>
        </Link>
      </section>

      <section className="card" style={{ borderLeft: '3px solid var(--danger)' }}>
        <h2 className="text-sm font-semibold mb-2" style={{ color: 'var(--danger)' }}>Danger Zone</h2>
        <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
          Permanently delete your account and all associated data — tasks, inbox, journal, mood logs, projects, weekly reviews, and saved health sources. This cannot be undone.
        </p>

        {!showConfirm ? (
          <button
            onClick={() => setShowConfirm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
            style={{ background: 'var(--danger)', color: 'white' }}
          >
            <Trash2 size={16} /> Delete account
          </button>
        ) : (
          <div className="rounded-lg p-4" style={{ background: 'color-mix(in srgb, var(--danger) 8%, transparent)', border: '1px solid var(--danger)' }}>
            <div className="flex items-start gap-2 mb-3">
              <AlertTriangle size={18} style={{ color: 'var(--danger)', flexShrink: 0, marginTop: '2px' }} />
              <p className="text-sm" style={{ color: 'var(--text)' }}>
                Type <strong>DELETE</strong> to confirm. Your account and all data will be removed immediately.
              </p>
            </div>
            <input
              type="text"
              value={confirmText}
              onChange={e => setConfirmText(e.target.value)}
              placeholder="Type DELETE"
              className="w-full px-3 py-2 rounded-lg text-sm mb-3"
              style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
              disabled={deleting}
            />
            {error && <p className="text-sm mb-3" style={{ color: 'var(--danger)' }}>{error}</p>}
            <div className="flex gap-2">
              <button
                onClick={handleDelete}
                disabled={confirmText !== 'DELETE' || deleting}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
                style={{
                  background: confirmText === 'DELETE' && !deleting ? 'var(--danger)' : 'var(--bg-card)',
                  color: confirmText === 'DELETE' && !deleting ? 'white' : 'var(--text-muted)',
                  cursor: confirmText === 'DELETE' && !deleting ? 'pointer' : 'not-allowed',
                  opacity: confirmText === 'DELETE' && !deleting ? 1 : 0.6,
                }}
              >
                {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                {deleting ? 'Deleting…' : 'Confirm delete'}
              </button>
              <button
                onClick={() => { setShowConfirm(false); setConfirmText(''); setError(null); }}
                disabled={deleting}
                className="px-4 py-2 rounded-lg text-sm"
                style={{ background: 'var(--bg-card)', color: 'var(--text)', border: '1px solid var(--border)' }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
