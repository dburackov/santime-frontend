'use client';

import { useEffect, useMemo, useState } from 'react';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import './Filters.css';
import { blurOnWheel } from '@/utils/numberInput';

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

  // Синхронизация с внешним значением (напр. при сбросе фильтров) без useEffect —
  // корректировка состояния во время рендера, рекомендованная React вместо sync-эффекта.
  if (priceMin !== prevPriceMin || priceMax !== prevPriceMax) {
    setPrevPriceMin(priceMin);
    setPrevPriceMax(priceMax);
    setLocalMin(priceMin?.toString() ?? '');
    setLocalMax(priceMax?.toString() ?? '');
  }

  // Гард по значению, а не по «первому запуску»: ref-флаг не переживал StrictMode, где
  // эффект монтирования выполняется дважды на одном инстансе — второй прогон проходил
  // мимо флага и дёргал onChange(undefined, undefined) при каждом заходе в категорию.
  // Это давало лишний router.replace, приглушение списка на его время и сброс ?page.
  // Зависимости намеренно только [debounced]: с priceMin/priceMax эффект срабатывал бы в
  // момент смены URL, когда локальное состояние ещё не догнало проп синхронизацией выше.
  useEffect(() => {
    const parsedMin = debounced.localMin ? Number(debounced.localMin) : undefined;
    const parsedMax = debounced.localMax ? Number(debounced.localMax) : undefined;
    if (parsedMin === priceMin && parsedMax === priceMax) return;
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
          onWheel={blurOnWheel}
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
          onWheel={blurOnWheel}
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
