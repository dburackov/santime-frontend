'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Обрезан ли блок своим max-height. Меряется только в свёрнутом виде (data-open="false"):
 * раскрытый блок ничего не обрезает, а кнопка «Свернуть» при этом нужна. Где обрезки нет
 * вовсе (десктоп), высоты совпадают и кнопка не появляется.
 */
export function useClampOverflow<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [overflowing, setOverflowing] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const measure = () => {
      if (element.dataset.open === 'true') return;
      setOverflowing(element.scrollHeight > element.clientHeight + 1);
    };
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return { ref, overflowing };
}
