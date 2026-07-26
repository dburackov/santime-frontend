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
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  // Access token живёт только в памяти, поэтому при перезагрузке страницы
  // сессию нужно молча восстановить через /refresh (cookie). mustChangePassword
  // тоже приходит заново — бэкенд читает его свежо из БД при каждом /refresh
  // (api.md §0.2), поэтому этот флаг корректно переживает reload.
  //
  // Строго через refreshSession, а не собственным вызовом /refresh: он один на всё
  // приложение и склеивает параллельные вызовы. Иначе этот эффект гонится сам с собой
  // (StrictMode вызывает его дважды) и с retry-после-401 в apiRequest — два /refresh
  // с одной cookie бэкенд трактует как переиспользование токена и отзывает все сессии.
  // Сам токен кладёт в память тоже refreshSession — здесь остаётся только
  // mustChangePassword и снятие флага инициализации.
  useEffect(() => {
    let cancelled = false;
    refreshSession()
      .then((res) => {
        if (cancelled) return;
        setMustChangePassword(res?.mustChangePassword ?? false);
      })
      .finally(() => {
        if (!cancelled) setIsInitializing(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiLogin({ email, password });
    setAccessToken(res.accessToken);
    setMustChangePassword(res.mustChangePassword);
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } finally {
      setAccessToken(null);
      setMustChangePassword(false);
    }
  }, []);

  const markPasswordChanged = useCallback(() => setMustChangePassword(false), []);

  const value = useMemo(
    () => ({
      isAuthenticated: accessToken !== null,
      isInitializing,
      mustChangePassword,
      login,
      logout,
      markPasswordChanged,
    }),
    [accessToken, isInitializing, mustChangePassword, login, logout, markPasswordChanged],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
