'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import './Filters.css';

interface PriceRangeFilterProps {
  priceMin: number | undefined;
  priceMax: number | undefined;
  onChange: (min: number | undefined, max: number | undefined) => void;
}

export function PriceRangeFilter({ priceMin, priceMax, onChange }: PriceRangeFilterProps) {
  const [localMin, setLocalMin] = useState(priceMin?.toString() ?? '');
  const [localMax, setLocalMax] = useState(priceMax?.toString() ?? '');
  const [prevPriceMin, setPrevPriceMin] = useState(priceMin);
  const [prevPriceMax, setPrevPriceMax] = useState(priceMax);
  // useMemo даёт стабильную ссылку, пока сами значения не изменились — иначе объектный
  // литерал пересоздавался бы на каждый рендер (в т.ч. посторонний) и постоянно сбрасывал debounce.
  const localValue = useMemo(() => ({ localMin, localMax }), [localMin, localMax]);
  const debounced = useDebouncedValue(localValue, 400);
  const isFirstRun = useRef(true);

  // Синхронизация с внешним значением (напр. при сбросе фильтров) без useEffect —
  // корректировка состояния во время рендера, рекомендованная React вместо sync-эффекта.
  if (priceMin !== prevPriceMin || priceMax !== prevPriceMax) {
    setPrevPriceMin(priceMin);
    setPrevPriceMax(priceMax);
    setLocalMin(priceMin?.toString() ?? '');
    setLocalMax(priceMax?.toString() ?? '');
  }

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    const parsedMin = debounced.localMin ? Number(debounced.localMin) : undefined;
    const parsedMax = debounced.localMax ? Number(debounced.localMax) : undefined;
    onChange(parsedMin, parsedMax);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  return (
    <div className="filter-block">
      <div className="filter-block__title">
        Цена
      </div>
      <div className="price-range-inputs">
        <input
          type="number"
          inputMode="numeric"
          min={0}
          placeholder="от"
          value={localMin}
          onChange={(e) => setLocalMin(e.target.value)}
          className="filter-text-input mono-num"
          aria-label="Цена от"
        />
        <span className="price-range-inputs__dash">—</span>
        <input
          type="number"
          inputMode="numeric"
          min={0}
          placeholder="до"
          value={localMax}
          onChange={(e) => setLocalMax(e.target.value)}
          className="filter-text-input mono-num"
          aria-label="Цена до"
        />
      </div>
    </div>
  );
}
