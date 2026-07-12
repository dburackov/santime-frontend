import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { ThemeContext, type Theme } from './theme-context';

const STORAGE_KEY = 'santime-theme';

function getSystemTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getStoredTheme(): Theme | null {
  if (typeof window === 'undefined') return null;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === 'light' || stored === 'dark' ? stored : null;
}

function applyTheme(theme: Theme) {
  if (theme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => getStoredTheme() ?? getSystemTheme());
  const [isSystemTheme, setIsSystemTheme] = useState<boolean>(() => getStoredTheme() === null);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    if (!isSystemTheme) return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = (event: MediaQueryListEvent) => {
      setThemeState(event.matches ? 'dark' : 'light');
    };
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [isSystemTheme]);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    setIsSystemTheme(false);
    window.localStorage.setItem(STORAGE_KEY, next);
  }, []);

  const resetToSystem = useCallback(() => {
    window.localStorage.removeItem(STORAGE_KEY);
    setIsSystemTheme(true);
    setThemeState(getSystemTheme());
  }, []);

  const value = useMemo(
    () => ({ theme, isSystemTheme, setTheme, resetToSystem }),
    [theme, isSystemTheme, setTheme, resetToSystem],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
