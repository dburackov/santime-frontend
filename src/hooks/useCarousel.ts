'use client';

import { useCallback, useEffect, useState } from 'react';

interface CarouselOptions {
  /** Пауза между автопереключениями. 0 или отсутствие — автопрокрутки нет. */
  autoplayMs?: number;
}

/**
 * Индекс, автопрокрутка и пауза для каруселей витрины (PromoSlider, HeroKits).
 * Жесты не входят: у слайдеров они завязаны на собственную разметку viewport'а.
 */
export function useCarousel(count: number, { autoplayMs = 0 }: CarouselOptions = {}) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  // Список мог измениться под сохранённым индексом. Нормализуем при рендере, а
  // не эффектом: лишний каскадный рендер не нужен.
  const safeIndex = count > 0 ? index % count : 0;

  const goTo = useCallback(
    (next: number) => {
      if (count === 0) return;
      setIndex(((next % count) + count) % count);
    },
    [count],
  );

  const next = useCallback(() => goTo(safeIndex + 1), [goTo, safeIndex]);
  const prev = useCallback(() => goTo(safeIndex - 1), [goTo, safeIndex]);

  useEffect(() => {
    if (!autoplayMs || count < 2 || paused) return;

    // Правило prefers-reduced-motion в reset.css обнуляет длительности CSS-анимаций,
    // но таймер оно не остановит — проверяем настройку явно.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const timer = window.setInterval(() => setIndex((prev) => (prev + 1) % count), autoplayMs);
    return () => window.clearInterval(timer);
  }, [autoplayMs, count, paused]);

  const pause = useCallback(() => setPaused(true), []);
  const resume = useCallback(() => setPaused(false), []);

  return { index: safeIndex, goTo, next, prev, pause, resume };
}
