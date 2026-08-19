'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Library, MessageSquare, FlaskConical, Heart, ClipboardCheck } from 'lucide-react';

const tabs = [
  { href: '/health/sources', label: 'Sources', icon: Library },
  { href: '/health/ask', label: 'Ask', icon: MessageSquare },
  { href: '/health/protocols', label: 'Protocols', icon: FlaskConical },
  { href: '/health/tracker', label: 'Tracker', icon: ClipboardCheck },
  { href: '/health/wellbeing', label: 'Wellbeing', icon: Heart },
];

export default function HealthNav() {
  const pathname = usePathname();

  return (
    <div className="flex gap-1 mb-6" style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 12,
      padding: 4,
      overflowX: 'auto',
      scrollbarWidth: 'none',
    }}>
      {tabs.map(tab => {
        const active = pathname === tab.href;
        const Icon = tab.icon;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              background: active ? 'var(--accent)' : 'transparent',
              color: active ? 'white' : 'var(--text-muted)',
              flex: '1 0 auto',
              justifyContent: 'center',
              whiteSpace: 'nowrap',
            }}
          >
            <Icon size={16} />
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
