'use client';

import { useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';

/**
 * Перетаскивание для упорядоченных списков админки: и для строк таблицы, и для сетки фото.
 * Цель перестановки выбирается по ближайшему центру элемента, поэтому направление (колонка
 * или сетка) роли не играет.
 *
 * Порядок во время перетаскивания держится локально и отдаётся наружу один раз на pointerup —
 * список не дёргается на каждом движении и не мигает, пока сервер отвечает.
 */
export function useDragOrder<T>(
  items: T[] | undefined,
  getId: (item: T) => number,
  onReorder: (ids: number[]) => void,
) {
  const [local, setLocal] = useState<{ serverKey: string; order: number[] } | null>(null);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const nodesRef = useRef(new Map<number, HTMLElement>());
  const orderRef = useRef<number[]>([]);

  const source = items ?? [];
  const serverIds = source.map(getId);
  const serverKey = serverIds.join(',');

  // Локальный порядок живёт ровно до следующего ответа сервера: пришли новые данные —
  // ключ разошёлся, и дальше показывается серверный порядок (он же и был отправлен).
  const order = local?.serverKey === serverKey ? local.order : null;

  const byId = new Map(source.map((item) => [getId(item), item]));
  const ordered = (order ?? serverIds).map((id) => byId.get(id)).filter((item): item is T => item !== undefined);

  function closestId(x: number, y: number): number | null {
    let bestId: number | null = null;
    let bestDistance = Number.POSITIVE_INFINITY;
    for (const [id, node] of nodesRef.current) {
      const rect = node.getBoundingClientRect();
      const dx = x - (rect.left + rect.width / 2);
      const dy = y - (rect.top + rect.height / 2);
      const distance = dx * dx + dy * dy;
      if (distance < bestDistance) {
        bestDistance = distance;
        bestId = id;
      }
    }
    return bestId;
  }

  function handlePointerDown(id: number) {
    return (event: ReactPointerEvent<HTMLElement>) => {
      if (event.button !== 0) return;
      event.preventDefault();

      orderRef.current = order ?? serverIds;
      setLocal({ serverKey, order: orderRef.current });
      setDraggingId(id);

      // Слушатели на window, а не на самой ручке: курсор во время перетаскивания уходит
      // за её пределы (особенно в сетке фото), а pointer capture переживает не каждый ввод.
      function handleMove(moveEvent: PointerEvent) {
        const targetId = closestId(moveEvent.clientX, moveEvent.clientY);
        if (targetId === null || targetId === id) return;

        const next = [...orderRef.current];
        const from = next.indexOf(id);
        const to = next.indexOf(targetId);
        if (from === -1 || to === -1) return;
        next.splice(to, 0, ...next.splice(from, 1));
        orderRef.current = next;
        setLocal({ serverKey, order: next });
      }

      function handleUp() {
        window.removeEventListener('pointermove', handleMove);
        window.removeEventListener('pointerup', handleUp);
        window.removeEventListener('pointercancel', handleUp);
        setDraggingId(null);
        if (orderRef.current.join(',') !== serverKey) {
          onReorder(orderRef.current);
        }
      }

      window.addEventListener('pointermove', handleMove);
      window.addEventListener('pointerup', handleUp);
      window.addEventListener('pointercancel', handleUp);
    };
  }

  return {
    items: ordered,
    draggingId,
    itemProps: (id: number) => ({
      ref: (node: HTMLElement | null) => {
        if (node) nodesRef.current.set(id, node);
        else nodesRef.current.delete(id);
      },
      'data-dragging': draggingId === id ? '' : undefined,
    }),
    handleProps: (id: number) => ({
      onPointerDown: handlePointerDown(id),
    }),
  };
}
