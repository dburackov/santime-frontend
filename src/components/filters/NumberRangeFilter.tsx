import { useEffect, useRef, useState } from 'react';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import type { CatalogFilterAttributeResponse } from '@/api/types';
import './Filters.css';

interface NumberRangeFilterProps {
  attribute: CatalogFilterAttributeResponse;
  min: number | undefined;
  max: number | undefined;
  onChange: (min: number | undefined, max: number | undefined) => void;
}

export function NumberRangeFilter({ attribute, min, max, onChange }: NumberRangeFilterProps) {
  const boundsMin = attribute.minValue ?? 0;
  const boundsMax = attribute.maxValue ?? 100;

  const [localMin, setLocalMin] = useState(min ?? boundsMin);
  const [localMax, setLocalMax] = useState(max ?? boundsMax);
  const [prevMin, setPrevMin] = useState(min);
  const [prevMax, setPrevMax] = useState(max);
  const debounced = useDebouncedValue({ localMin, localMax }, 300);
  const isFirstRun = useRef(true);

  // Синхронизация с внешним значением (напр. при сбросе фильтров) без useEffect —
  // корректировка состояния во время рендера, рекомендованная React вместо sync-эффекта.
  if (min !== prevMin || max !== prevMax) {
    setPrevMin(min);
    setPrevMax(max);
    setLocalMin(min ?? boundsMin);
    setLocalMax(max ?? boundsMax);
  }

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    const isAtDefaultMin = debounced.localMin <= boundsMin;
    const isAtDefaultMax = debounced.localMax >= boundsMax;
    onChange(isAtDefaultMin ? undefined : debounced.localMin, isAtDefaultMax ? undefined : debounced.localMax);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  if (boundsMin >= boundsMax) return null;

  const fillLeft = ((localMin - boundsMin) / (boundsMax - boundsMin)) * 100;
  const fillRight = 100 - ((localMax - boundsMin) / (boundsMax - boundsMin)) * 100;

  return (
    <div className="filter-block">
      <div className="filter-block__title">
        {attribute.name}
        {attribute.unit ? `, ${attribute.unit}` : ''}
      </div>
      <div className="range-slider">
        <div className="range-slider__track" />
        <div className="range-slider__fill" style={{ left: `${fillLeft}%`, right: `${fillRight}%` }} />
        <input
          type="range"
          min={boundsMin}
          max={boundsMax}
          value={localMin}
          onChange={(e) => setLocalMin(Math.min(Number(e.target.value), localMax))}
          className="range-slider__input"
          aria-label={`${attribute.name} — от`}
        />
        <input
          type="range"
          min={boundsMin}
          max={boundsMax}
          value={localMax}
          onChange={(e) => setLocalMax(Math.max(Number(e.target.value), localMin))}
          className="range-slider__input"
          aria-label={`${attribute.name} — до`}
        />
      </div>
      <div className="range-values">
        <span className="mono-num">{localMin}</span>
        <span className="mono-num">{localMax}</span>
      </div>
    </div>
  );
}
