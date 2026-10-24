'use client';

import { useCallback, useEffect, useRef } from 'react';

/** Страховка для браузеров без события scrollend: длинная плавная прокрутка укладывается примерно в секунду. */
const SCROLL_END_FALLBACK_MS = 1000;

/**
 * Дождаться конца плавной прокрутки и только потом что-то сделать. Ожидание одно на
 * компонент: новый вызов wait() или cancel() забывает прежнее, иначе поздний конец
 * старой прокрутки сработал бы поверх нового действия. При размонтировании снимается само.
 */
export function useScrollEnd() {
  const cancelRef = useRef<(() => void) | null>(null);

  const cancel = useCallback(() => {
    cancelRef.current?.();
    cancelRef.current = null;
  }, []);

  const wait = useCallback(
    (target: Window | HTMLElement, onEnd: () => void) => {
      cancel();
      const finish = () => {
        cancel();
        onEnd();
      };
      target.addEventListener('scrollend', finish);
      const timer = window.setTimeout(finish, SCROLL_END_FALLBACK_MS);
      cancelRef.current = () => {
        target.removeEventListener('scrollend', finish);
        window.clearTimeout(timer);
      };
    },
    [cancel],
  );

  useEffect(() => cancel, [cancel]);

  return { wait, cancel };
}
