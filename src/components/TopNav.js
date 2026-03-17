'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useState } from 'react';
import {
  LayoutDashboard, Inbox, CheckSquare, Grid3X3, FolderKanban,
  Mail, Calendar, ClipboardCheck, LogOut, Brain, Plus, ChevronDown,
  ListTodo, BookOpen, Sun
} from 'lucide-react';

const nav = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/today', label: 'Today', icon: Sun },
  { href: '/inbox', label: 'Inbox', icon: Inbox },
  { href: '/tasks', label: 'Tasks', icon: CheckSquare },
  { href: '/matrix', label: 'Matrix', icon: Grid3X3 },
  { href: '/projects', label: 'Projects', icon: FolderKanban },
  { href: '/email', label: 'Email', icon: Mail },
  { href: '/calendar', label: 'Calendar', icon: Calendar },
  { href: '/journal', label: 'Journal', icon: BookOpen },
  { href: '/weekly-review', label: 'Review', icon: ClipboardCheck },
];

export default function TopNav({ onQuickAdd }) {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header className="topnav">
      <div className="topnav-inner">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#3b82f6' }}>
            <Brain size={18} color="white" />
          </div>
          <span className="font-bold text-base text-white">MindOS</span>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-0.5 mx-6 flex-1 overflow-x-auto hide-scrollbar">
          {nav.map(item => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`topnav-link ${active ? 'active' : ''}`}
              >
                <Icon size={15} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right side: Quick Add + User */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onQuickAdd}
            className="quick-add-btn"
            title="Quick add task (⌘K)"
          >
            <Plus size={16} />
            <span>Add Task</span>
          </button>

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors"
              style={{ color: '#94a3b8' }}
            >
              {user?.user_metadata?.avatar_url ? (
                <img src={user.user_metadata.avatar_url} alt="" className="w-7 h-7 rounded-full" />
              ) : (
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium" style={{ background: '#334155', color: '#94a3b8' }}>
                  {user?.email?.[0]?.toUpperCase()}
                </div>
              )}
              <ChevronDown size={14} />
            </button>

            {showUserMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                <div className="absolute right-0 top-full mt-2 z-50 w-48 rounded-xl py-1" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)' }}>
                  <div className="px-3 py-2 border-b" style={{ borderColor: 'var(--border)' }}>
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>
                      {user?.user_metadata?.full_name || user?.email}
                    </p>
                    <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                      {user?.email}
                    </p>
                  </div>
                  <button
                    onClick={() => { setShowUserMenu(false); signOut(); }}
                    className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:opacity-80"
                    style={{ color: 'var(--danger)' }}
                  >
                    <LogOut size={14} /> Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
