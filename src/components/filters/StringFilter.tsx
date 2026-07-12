import { useEffect, useRef, useState } from 'react';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import type { CatalogFilterAttributeResponse } from '@/api/types';
import './Filters.css';

interface StringFilterProps {
  attribute: CatalogFilterAttributeResponse;
  value: string | undefined;
  onChange: (value: string | undefined) => void;
}

export function StringFilter({ attribute, value, onChange }: StringFilterProps) {
  const [local, setLocal] = useState(value ?? '');
  const [prevValue, setPrevValue] = useState(value);
  const debounced = useDebouncedValue(local, 400);
  const isFirstRun = useRef(true);

  // Синхронизация с внешним значением (напр. при сбросе фильтров) без useEffect —
  // корректировка состояния во время рендера, рекомендованная React вместо sync-эффекта.
  if (value !== prevValue) {
    setPrevValue(value);
    setLocal(value ?? '');
  }

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    onChange(debounced.trim() || undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  return (
    <div className="filter-block">
      <div className="filter-block__title">{attribute.name}</div>
      <input
        type="text"
        className="filter-text-input"
        placeholder={`Например, ${attribute.name.toLowerCase()}`}
        value={local}
        onChange={(e) => setLocal(e.target.value)}
      />
    </div>
  );
}
