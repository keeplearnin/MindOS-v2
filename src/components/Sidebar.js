'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import {
  LayoutDashboard, Inbox, CheckSquare, Grid3X3, FolderKanban,
  Mail, Calendar, ClipboardCheck, LogOut, Brain
} from 'lucide-react';

const nav = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/inbox', label: 'Inbox', icon: Inbox },
  { href: '/tasks', label: 'Next Actions', icon: CheckSquare },
  { href: '/matrix', label: 'Eisenhower Matrix', icon: Grid3X3 },
  { href: '/projects', label: 'Projects', icon: FolderKanban },
  { href: '/email', label: 'Email → Todo', icon: Mail },
  { href: '/calendar', label: 'Calendar', icon: Calendar },
  { href: '/weekly-review', label: 'Weekly Review', icon: ClipboardCheck },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  return (
    <aside className="fixed left-0 top-0 h-full w-64 flex flex-col" style={{ background: 'var(--bg-sidebar)' }}>
      {/* Logo */}
      <div className="p-5 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: '#3b82f6' }}>
          <Brain size={20} color="white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-white">MindOS</h1>
          <p className="text-xs" style={{ color: '#64748b' }}>7 Habits + GTD</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        {nav.map(item => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all"
              style={{
                background: active ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                color: active ? '#93c5fd' : '#94a3b8',
                fontWeight: active ? 500 : 400,
              }}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="p-4" style={{ borderTop: '1px solid #334155' }}>
        <div className="flex items-center gap-3">
          {user?.user_metadata?.avatar_url && (
            <img src={user.user_metadata.avatar_url} alt="" className="w-8 h-8 rounded-full" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate text-white">
              {user?.user_metadata?.full_name || user?.email}
            </p>
          </div>
          <button onClick={signOut} className="p-1.5 rounded-lg transition-colors" style={{ color: '#94a3b8' }} title="Sign out">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
