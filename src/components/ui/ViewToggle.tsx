import './ViewToggle.css';
import { GridIcon, ListIcon } from './icons';
import type { ViewMode } from '@/hooks/useViewMode';

interface ViewToggleProps {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
}

export function ViewToggle({ value, onChange }: ViewToggleProps) {
  return (
    <div className="view-toggle" role="group" aria-label="Режим отображения">
      <button
        type="button"
        className={`view-toggle__btn ${value === 'grid' ? 'view-toggle__btn--active' : ''}`}
        onClick={() => onChange('grid')}
        aria-pressed={value === 'grid'}
        title="Сетка"
      >
        <GridIcon width={16} height={16} />
      </button>
      <button
        type="button"
        className={`view-toggle__btn ${value === 'list' ? 'view-toggle__btn--active' : ''}`}
        onClick={() => onChange('list')}
        aria-pressed={value === 'list'}
        title="Список"
      >
        <ListIcon width={16} height={16} />
      </button>
    </div>
  );
}
