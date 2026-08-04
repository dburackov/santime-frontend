'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { ThemeContext, type Theme } from './theme-context';
import { THEME_STORAGE_KEY as STORAGE_KEY } from './theme-script';

function getSystemTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getStoredTheme(): Theme | null {
  if (typeof window === 'undefined') return null;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === 'light' || stored === 'dark' ? stored : null;
}

/**
 * Тема, которую блокирующий скрипт из app/layout.tsx уже проставил на <html>
 * до первой отрисовки. Читаем её, а не localStorage напрямую: это тот же
 * результат, но он гарантированно совпадает с тем, что уже видно на экране.
 */
function getAppliedTheme(): Theme {
  if (typeof document === 'undefined') return 'light';
  return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
}

function applyTheme(theme: Theme) {
  if (theme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Первый рендер обязан совпасть с серверным, поэтому стартуем с 'light' и
  // синхронизируемся с реальной темой сразу после монтирования. Само значение
  // атрибута на <html> к этому моменту уже верное — его проставил инлайн-скрипт,
  // так что визуального мигания нет, меняется только состояние в React.
  const [theme, setThemeState] = useState<Theme>('light');
  const [isSystemTheme, setIsSystemTheme] = useState(true);
  const hydrated = useRef(false);

  useEffect(() => {
    // Паттерн гидрации, см. пояснение в CartContext. Здесь он вдобавок не даёт
    // визуального скачка: атрибут data-theme к моменту этого рендера уже
    // проставлен инлайн-скриптом, синхронизируется только состояние React.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setThemeState(getAppliedTheme());
    setIsSystemTheme(getStoredTheme() === null);
    hydrated.current = true;
  }, []);

  useEffect(() => {
    // До гидрации трогать <html> нельзя: там уже стоит значение от инлайн-скрипта,
    // а состояние ещё держит заглушку 'light' и затёрло бы тёмную тему.
    if (!hydrated.current) return;
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
