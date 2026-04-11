'use client';

import AppShell from '@/components/AppShell';
import HealthNav from '@/components/HealthNav';
import { useHealthProtocols, updateProtocol } from '@/lib/health-hooks';
import { FlaskConical, Loader2, Play, Pause, CheckCircle2, ChevronDown, ChevronUp, Calendar, Target, ListChecks, ArrowRight } from 'lucide-react';
import { useState } from 'react';

const STATUS_CONFIG = {
  active: { label: 'Active', color: 'var(--q2)', bg: 'rgba(16, 185, 129, 0.1)' },
  draft: { label: 'Draft', color: 'var(--text-muted)', bg: 'rgba(136, 146, 168, 0.1)' },
  paused: { label: 'Paused', color: 'var(--warning)', bg: 'rgba(245, 158, 11, 0.1)' },
  completed: { label: 'Completed', color: 'var(--accent)', bg: 'rgba(99, 102, 241, 0.1)' },
  abandoned: { label: 'Abandoned', color: 'var(--danger)', bg: 'rgba(239, 68, 68, 0.1)' },
};

function ProtocolsContent() {
  const { data: protocols, loading } = useHealthProtocols();
  const [expandedProtocol, setExpandedProtocol] = useState(null);

  // Group by status
  const grouped = { active: [], draft: [], paused: [], completed: [], abandoned: [] };
  for (const p of protocols) {
    (grouped[p.status] || grouped.draft).push(p);
  }
  const orderedStatuses = ['active', 'draft', 'paused', 'completed', 'abandoned'];

  return (
    <div className="max-w-4xl animate-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--accent)', opacity: 0.9 }}>
          <FlaskConical size={22} color="white" />
        </div>
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>Health Protocols</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Track experiments derived from expert evidence</p>
        </div>
      </div>

      <HealthNav />

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="animate-spin" style={{ color: 'var(--accent)' }} />
        </div>
      ) : protocols.length === 0 ? (
        <div className="card text-center py-12">
          <FlaskConical size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 12px' }} />
          <p className="text-base font-medium mb-1" style={{ color: 'var(--text)' }}>No protocols yet</p>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Ask a health question and create a protocol from the answer.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {orderedStatuses.map(status => {
            const items = grouped[status];
            if (items.length === 0) return null;
            const config = STATUS_CONFIG[status];
            return (
              <div key={status}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color: config.color }}>
                    {config.label}
                  </span>
                  <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: config.bg, color: config.color }}>
                    {items.length}
                  </span>
                </div>
                <div className="space-y-3">
                  {items.map(protocol => (
                    <ProtocolCard
                      key={protocol.id}
                      protocol={protocol}
                      expanded={expandedProtocol === protocol.id}
                      onToggle={() => setExpandedProtocol(expandedProtocol === protocol.id ? null : protocol.id)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ProtocolCard({ protocol, expanded, onToggle }) {
  const [updating, setUpdating] = useState(false);
  const [results, setResults] = useState(protocol.results || '');
  const config = STATUS_CONFIG[protocol.status] || STATUS_CONFIG.draft;

  const steps = protocol.protocol_steps || [];
  const criteria = protocol.success_criteria || [];

  // Calculate progress for active protocols
  let progressPct = 0;
  if (protocol.status === 'active' && protocol.start_date) {
    const start = new Date(protocol.start_date);
    const now = new Date();
    const elapsed = Math.floor((now - start) / (1000 * 60 * 60 * 24));
    progressPct = protocol.timeframe_days > 0 ? Math.min(100, Math.round((elapsed / protocol.timeframe_days) * 100)) : 100;
  }

  const handleStatusChange = async (newStatus) => {
    setUpdating(true);
    try {
      const updates = { status: newStatus };
      if (newStatus === 'active' && !protocol.start_date) {
        updates.start_date = new Date().toISOString().split('T')[0];
      }
      if (newStatus === 'completed') {
        updates.end_date = new Date().toISOString().split('T')[0];
        updates.results = results;
      }
      await updateProtocol(protocol.id, updates);
    } catch (err) {
      console.error('Status update error:', err);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="card">
      <div className="flex items-start gap-3 cursor-pointer" onClick={onToggle}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
          style={{ background: config.bg }}>
          <FlaskConical size={16} style={{ color: config.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{protocol.title}</p>
          {protocol.hypothesis && (
            <p className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--text-muted)' }}>{protocol.hypothesis}</p>
          )}
          <div className="flex items-center gap-3 mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
            <span className="flex items-center gap-1">
              <ListChecks size={12} /> {steps.length} steps
            </span>
            <span className="flex items-center gap-1">
              <Target size={12} /> {criteria.length} criteria
            </span>
            <span className="flex items-center gap-1">
              <Calendar size={12} /> {protocol.timeframe_days}d
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs px-2 py-1 rounded-full font-medium"
            style={{ background: config.bg, color: config.color }}>
            {config.label}
          </span>
          {expanded ? <ChevronUp size={14} style={{ color: 'var(--text-muted)' }} /> : <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />}
        </div>
      </div>

      {/* Active progress bar */}
      {protocol.status === 'active' && protocol.start_date && (
        <div className="mt-3">
          <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
            <span>Day {Math.floor((new Date() - new Date(protocol.start_date)) / (1000 * 60 * 60 * 24))}</span>
            <span>{protocol.timeframe_days} days</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
            <div className="h-full rounded-full" style={{ width: `${progressPct}%`, background: 'var(--q2)' }} />
          </div>
        </div>
      )}

      {/* Expanded details */}
      {expanded && (
        <div className="mt-4 pt-4 border-t space-y-4" style={{ borderColor: 'var(--border)' }}>
          {/* Hypothesis */}
          {protocol.hypothesis && (
            <div>
              <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>HYPOTHESIS</p>
              <p className="text-sm" style={{ color: 'var(--text)' }}>{protocol.hypothesis}</p>
            </div>
          )}

          {/* Steps */}
          {steps.length > 0 && (
            <div>
              <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>PROTOCOL STEPS</p>
              <div className="space-y-2">
                {steps.map((step, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <span className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
                      style={{ background: 'var(--accent-bg)', color: 'var(--accent)' }}>
                      {step.order || i + 1}
                    </span>
                    <div>
                      <p style={{ color: 'var(--text)' }}>{step.action}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {[step.frequency, step.duration].filter(Boolean).join(' · ')}
                        {step.notes ? ` — ${step.notes}` : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Success Criteria */}
          {criteria.length > 0 && (
            <div>
              <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>SUCCESS CRITERIA</p>
              <div className="space-y-1.5">
                {criteria.map((c, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg" style={{ background: 'var(--bg)' }}>
                    <Target size={14} style={{ color: 'var(--q2)' }} />
                    <span style={{ color: 'var(--text)' }}>{c.metric}</span>
                    <ArrowRight size={12} style={{ color: 'var(--text-muted)' }} />
                    <span className="font-medium" style={{ color: 'var(--q2)' }}>{c.target}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Results textarea for completing */}
          {(protocol.status === 'active' || protocol.status === 'paused') && (
            <div>
              <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>RESULTS / NOTES</p>
              <textarea
                className="input w-full text-sm"
                rows={3}
                placeholder="How did this experiment go? What did you observe?"
                value={results}
                onChange={(e) => setResults(e.target.value)}
              />
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2 flex-wrap">
            {protocol.status === 'draft' && (
              <button className="btn btn-primary flex items-center gap-1.5 text-xs"
                onClick={() => handleStatusChange('active')} disabled={updating}>
                {updating ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} />}
                Start Experiment
              </button>
            )}
            {protocol.status === 'active' && (
              <>
                <button className="btn btn-ghost flex items-center gap-1.5 text-xs"
                  onClick={() => handleStatusChange('paused')} disabled={updating}
                  style={{ color: 'var(--warning)' }}>
                  <Pause size={13} /> Pause
                </button>
                <button className="btn btn-primary flex items-center gap-1.5 text-xs"
                  onClick={() => handleStatusChange('completed')} disabled={updating}>
                  {updating ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                  Complete
                </button>
              </>
            )}
            {protocol.status === 'paused' && (
              <button className="btn btn-primary flex items-center gap-1.5 text-xs"
                onClick={() => handleStatusChange('active')} disabled={updating}>
                <Play size={13} /> Resume
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Page() {
  return <AppShell><ProtocolsContent /></AppShell>;
}
