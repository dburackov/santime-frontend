import { useCallback, useState } from 'react';

export type ViewMode = 'grid' | 'list';

const STORAGE_KEY = 'santime-view-mode';

function getStoredViewMode(): ViewMode {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === 'list' ? 'list' : 'grid';
}

export function useViewMode() {
  const [viewMode, setViewModeState] = useState<ViewMode>(getStoredViewMode);

  const setViewMode = useCallback((mode: ViewMode) => {
    setViewModeState(mode);
    window.localStorage.setItem(STORAGE_KEY, mode);
  }, []);

  return { viewMode, setViewMode };
}
