'use client';

import './ViewToggle.css';
import { GridIcon, ListIcon } from './icons';
import type { ViewMode } from '@/hooks/useViewMode';

interface ViewToggleProps {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
}

export function ViewToggle({ value, onChange }: ViewToggleProps) {
  const isGrid = value === 'grid';

  return (
    <div className="view-toggle" role="group" aria-label="Режим отображения">
      {/* Мобильный вариант той же группы: одна кнопка с иконкой текущего режима.
          Ширина проверяется медиазапросом, а не в рендере — разметка сервера и
          первого клиентского рендера обязана совпадать. */}
      <button
        type="button"
        className="view-toggle__btn view-toggle__btn--single"
        onClick={() => onChange(isGrid ? 'list' : 'grid')}
        aria-label={
          isGrid ? 'Вид: сетка. Переключить на список' : 'Вид: список. Переключить на сетку'
        }
        title="Переключить вид"
      >
        {isGrid ? <GridIcon width={18} height={18} /> : <ListIcon width={18} height={18} />}
      </button>
      <button
        type="button"
        className={`view-toggle__btn view-toggle__btn--pair ${value === 'grid' ? 'view-toggle__btn--active' : ''}`}
        onClick={() => onChange('grid')}
        aria-pressed={value === 'grid'}
        title="Сетка"
      >
        <GridIcon width={18} height={18} />
      </button>
      <button
        type="button"
        className={`view-toggle__btn view-toggle__btn--pair ${value === 'list' ? 'view-toggle__btn--active' : ''}`}
        onClick={() => onChange('list')}
        aria-pressed={value === 'list'}
        title="Список"
      >
        <ListIcon width={18} height={18} />
      </button>
    </div>
  );
}
