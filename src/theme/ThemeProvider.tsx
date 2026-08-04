'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
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
  // Держим в синхроне с инлайн-стилем, который проставил скрипт из
  // theme-script.ts: иначе после переключения тумблером у браузера осталась бы
  // прежняя схема, и системные элементы (скроллбары, поля ввода) не переоделись бы.
  document.documentElement.style.colorScheme = theme;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Первый рендер обязан совпасть с серверным, поэтому стартуем с 'light' и
  // синхронизируемся с реальной темой сразу после монтирования. Само значение
  // атрибута на <html> к этому моменту уже верное — его проставил инлайн-скрипт,
  // так что визуального мигания нет, меняется только состояние в React.
  const [theme, setThemeState] = useState<Theme>('light');
  const [isSystemTheme, setIsSystemTheme] = useState(true);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Паттерн гидрации, см. пояснение в CartContext. Скачка не даёт: атрибут
    // data-theme к этому моменту уже проставлен инлайн-скриптом, синхронизируется
    // только состояние React.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setThemeState(getAppliedTheme());
    setIsSystemTheme(getStoredTheme() === null);
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    // Флаг обязан быть состоянием, а не ref: ref меняется синхронно, поэтому
    // этот эффект проходил бы проверку уже на монтировании — но `theme` в его
    // замыкании ещё держит стартовое 'light' (перерендер от setThemeState выше
    // ещё не случился). Он снимал бы data-theme, и тёмная тема моргала светлой
    // до следующего рендера. Состояние переключается только вместе с темой,
    // так что первый вызов applyTheme приходит уже с настоящим значением.
    if (!isHydrated) return;
    applyTheme(theme);
  }, [theme, isHydrated]);

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
