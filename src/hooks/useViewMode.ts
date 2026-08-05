'use client';

import { useCallback, useState } from 'react';
import { VIEW_MODE_COOKIE, VIEW_MODE_MAX_AGE, type ViewMode } from './viewMode';

export type { ViewMode };

/**
 * Режим отображения хранится в куке, а не в localStorage — вопреки соседним
 * хранилищам вроде CartContext, и это осознанно.
 *
 * Режим определяет, какие компоненты рисовать (ProductCard против
 * ProductListRow), поэтому React должен знать его уже на первом рендере. Пока
 * значение лежало в localStorage, сервер его не видел: разметка приходила
 * сеткой, а список подставлялся эффектом после монтирования — на каждой
 * перезагрузке страница дёргалась.
 *
 * Трюк темы (блокирующий скрипт ставит атрибут на <html> до отрисовки) здесь
 * не работает: скрипт правит DOM, но не может подменить React-дерево. Кука же
 * уходит на сервер вместе с запросом, и категория — она всё равно
 * force-dynamic — отдаёт сразу нужную разметку.
 *
 * Начальное значение приходит пропом от серверного компонента, поэтому хук
 * больше не читает хранилище сам и не нуждается в эффекте синхронизации.
 */
export function useViewMode(initial: ViewMode) {
  const [viewMode, setViewModeState] = useState<ViewMode>(initial);

  const setViewMode = useCallback((mode: ViewMode) => {
    setViewModeState(mode);
    // Кука намеренно не httpOnly: это UI-настройка, её ставит клиент.
    document.cookie = `${VIEW_MODE_COOKIE}=${mode}; path=/; max-age=${VIEW_MODE_MAX_AGE}; SameSite=Lax`;
  }, []);

  return { viewMode, setViewMode };
}
