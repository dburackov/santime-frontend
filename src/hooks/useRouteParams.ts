'use client';

import { useParams } from 'next/navigation';

/**
 * useParams из next/navigation типизирован как `T | null`, потому что его можно
 * вызвать и вне матчнутого роута. На странице, у которой в пути есть сегмент
 * [param], он заполнен всегда — оборачиваем это здесь один раз, чтобы не
 * протаскивать `?? {}` и `!` по всем страницам админки.
 */
export function useRouteParams<T extends Record<string, string>>(): Partial<T> {
  return (useParams() ?? {}) as Partial<T>;
}
