'use client';

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import type { ReactNode } from 'react';
import { AuthContext } from './auth-context';
import { getAccessToken, setAccessToken, subscribeAccessToken } from './tokenStore';
import { login as apiLogin, logout as apiLogout } from '@/api/auth';
import { refreshSession } from '@/api/client';

function subscribe(listener: () => void) {
  return subscribeAccessToken(listener);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const accessToken = useSyncExternalStore(subscribe, getAccessToken, () => null);
  const [isInitializing, setIsInitializing] = useState(true);

  // Access token живёт только в памяти, поэтому при перезагрузке страницы
  // сессию нужно молча восстановить через /refresh (cookie).
  //
  // Строго через refreshSession, а не собственным вызовом /refresh: он один на всё
  // приложение и склеивает параллельные вызовы. Иначе этот эффект гонится сам с собой
  // (StrictMode вызывает его дважды) и с retry-после-401 в apiRequest — два /refresh
  // с одной cookie бэкенд трактует как переиспользование токена и отзывает все сессии.
  // Сам токен кладёт в память тоже refreshSession — здесь остаётся только снятие
  // флага инициализации.
  useEffect(() => {
    let cancelled = false;
    refreshSession().finally(() => {
      if (!cancelled) setIsInitializing(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiLogin({ email, password });
    setAccessToken(res.accessToken);
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } finally {
      setAccessToken(null);
    }
  }, []);

  const value = useMemo(
    () => ({
      isAuthenticated: accessToken !== null,
      isInitializing,
      login,
      logout,
    }),
    [accessToken, isInitializing, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
