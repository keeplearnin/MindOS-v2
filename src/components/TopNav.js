'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useState } from 'react';
import {
  LayoutDashboard, Inbox, CheckSquare, Grid3X3, FolderKanban,
  Mail, Calendar, ClipboardCheck, LogOut, Brain, Plus, ChevronDown,
  BookOpen, Sun, Menu, X, Heart, Moon
} from 'lucide-react';
import { useTheme } from '@/lib/theme-context';

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
  { href: '/wellbeing', label: 'Wellbeing', icon: Heart },
  { href: '/weekly-review', label: 'Review', icon: ClipboardCheck },
];

// Bottom bar items for mobile (5 key items)
const mobileNav = [
  { href: '/today', label: 'Today', icon: Sun },
  { href: '/tasks', label: 'Tasks', icon: CheckSquare },
  { href: '/matrix', label: 'Matrix', icon: Grid3X3 },
  { href: '/calendar', label: 'Calendar', icon: Calendar },
  { href: '/journal', label: 'Journal', icon: BookOpen },
];

export default function TopNav({ onQuickAdd }) {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  return (
    <>
      {/* ===== Desktop/Tablet Top Bar ===== */}
      <header className="topnav">
        <div className="topnav-inner">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent)' }}>
              <Brain size={18} color="white" />
            </div>
            <span className="font-bold text-base text-white topnav-logo-text">MindOS</span>
          </Link>

          {/* Desktop Navigation - hidden on mobile */}
          <nav className="topnav-desktop-links">
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

          {/* Right side */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="theme-toggle"
              title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            >
              {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
            </button>

            {/* Quick Add */}
            <button
              onClick={onQuickAdd}
              className="quick-add-btn"
              title="Quick add task (⌘K)"
            >
              <Plus size={16} />
              <span className="quick-add-btn-text">Add Task</span>
            </button>

            {/* Mobile hamburger */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="mobile-menu-btn"
            >
              {showMobileMenu ? <X size={22} color="white" /> : <Menu size={22} color="white" />}
            </button>

            {/* User menu - desktop */}
            <div className="relative topnav-user-menu">
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

      {/* ===== Mobile Slide-out Menu ===== */}
      {showMobileMenu && (
        <>
          <div className="mobile-menu-overlay" onClick={() => setShowMobileMenu(false)} />
          <div className="mobile-menu-drawer">
            {/* User info at top */}
            <div className="px-4 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-3">
                {user?.user_metadata?.avatar_url ? (
                  <img src={user.user_metadata.avatar_url} alt="" className="w-10 h-10 rounded-full" />
                ) : (
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium" style={{ background: 'var(--accent-bg)', color: 'var(--accent)' }}>
                    {user?.email?.[0]?.toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>
                    {user?.user_metadata?.full_name || 'User'}
                  </p>
                  <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                    {user?.email}
                  </p>
                </div>
              </div>
            </div>

            {/* All nav links */}
            <nav className="py-2">
              {nav.map(item => {
                const active = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setShowMobileMenu(false)}
                    className="mobile-menu-link"
                    style={{
                      color: active ? 'var(--accent)' : 'var(--text)',
                      background: active ? 'var(--accent-bg)' : 'transparent',
                    }}
                  >
                    <Icon size={20} style={{ color: active ? 'var(--accent)' : 'var(--text-muted)' }} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Theme toggle & Sign out */}
            <div className="mt-auto border-t px-4 py-3 space-y-1" style={{ borderColor: 'var(--border)' }}>
              <button
                onClick={toggleTheme}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm"
                style={{ color: 'var(--text-secondary)' }}
              >
                {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
                {theme === 'light' ? 'Dark mode' : 'Light mode'}
              </button>
              <button
                onClick={() => { setShowMobileMenu(false); signOut(); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm"
                style={{ color: 'var(--danger)' }}
              >
                <LogOut size={18} /> Sign out
              </button>
            </div>
          </div>
        </>
      )}

      {/* ===== Mobile Bottom Tab Bar ===== */}
      <nav className="mobile-bottom-bar">
        {mobileNav.map(item => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="mobile-tab"
              style={{ color: active ? 'var(--accent)' : 'var(--text-muted)' }}
            >
              {active && <div className="mobile-tab-indicator" />}
              <Icon size={22} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
