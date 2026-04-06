'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ThemeContext = createContext({ theme: 'light', toggleTheme: () => {} });

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light');
  const [mounted, setMounted] = useState(false);

  // Read saved preference on mount
  useEffect(() => {
    const saved = localStorage.getItem('mindos-theme');
    if (saved === 'dark' || saved === 'light') {
      setTheme(saved);
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
    }
    setMounted(true);
  }, []);

  // Apply theme to <html>
  useEffect(() => {
    if (!mounted) return;
    const html = document.documentElement;
    html.classList.add('theme-transition');
    html.setAttribute('data-theme', theme);
    localStorage.setItem('mindos-theme', theme);
    // Remove transition class after animation completes
    const timer = setTimeout(() => html.classList.remove('theme-transition'), 350);
    return () => clearTimeout(timer);
  }, [theme, mounted]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
