import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import type { ReactNode } from 'react';
import { AuthContext } from './auth-context';
import { getAccessToken, setAccessToken, subscribeAccessToken } from './tokenStore';
import { login as apiLogin, logout as apiLogout, refresh as apiRefresh } from '@/api/auth';

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
  useEffect(() => {
    let cancelled = false;
    apiRefresh()
      .then((res) => {
        if (cancelled) return;
        setAccessToken(res.accessToken);
        setMustChangePassword(res.mustChangePassword);
      })
      .catch(() => {
        if (cancelled) return;
        setAccessToken(null);
        setMustChangePassword(false);
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
