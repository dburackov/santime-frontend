'use client';

import { useCallback, useEffect, useState } from 'react';

export type ViewMode = 'grid' | 'list';

const STORAGE_KEY = 'santime-view-mode';

function getStoredViewMode(): ViewMode {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === 'list' ? 'list' : 'grid';
}

export function useViewMode() {
  // Как и в корзине: серверный рендер не знает про localStorage, поэтому
  // стартуем с дефолта и подтягиваем сохранённый режим после монтирования.
  const [viewMode, setViewModeState] = useState<ViewMode>('grid');

  useEffect(() => {
    // Паттерн гидрации, см. пояснение в CartContext: сохранённый режим доступен
    // только в браузере, поэтому подставляется одним рендером после монтирования.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setViewModeState(getStoredViewMode());
  }, []);

  const setViewMode = useCallback((mode: ViewMode) => {
    setViewModeState(mode);
    window.localStorage.setItem(STORAGE_KEY, mode);
  }, []);

  return { viewMode, setViewMode };
}
