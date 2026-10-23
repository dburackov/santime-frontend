'use client';

import './PickupMap.css';
import { useEffect, useRef, useState } from 'react';
import { PICKUP } from '@/config/delivery';

// Окно карты вокруг точки: по долготе вдвое шире, чем по широте, — на широте Минска
// градус долготы почти вдвое короче, и так окно выходит примерно квадратным.
const LAT_SPAN = 0.003;
const LON_SPAN = 0.006;

const bbox = [
  PICKUP.lon - LON_SPAN,
  PICKUP.lat - LAT_SPAN,
  PICKUP.lon + LON_SPAN,
  PICKUP.lat + LAT_SPAN,
].join(',');

const EMBED_URL =
  `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}` +
  `&layer=mapnik&marker=${PICKUP.lat},${PICKUP.lon}`;

/**
 * Карта пункта самовывоза — встроенный OpenStreetMap, атрибуцию рисует сам iframe.
 * Отключить в нём зум колесом нельзя, поэтому карту накрывает заслонка: колесо и свайп
 * по ней листают страницу, а карта включается по клику и выключается, когда указатель
 * ушёл с неё или нажали где-то ещё.
 */
export function PickupMap({ className }: { className?: string }) {
  const [active, setActive] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active) return;
    const deactivateOutside = (event: PointerEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) setActive(false);
    };
    document.addEventListener('pointerdown', deactivateOutside);
    return () => document.removeEventListener('pointerdown', deactivateOutside);
  }, [active]);

  return (
    <div ref={wrapperRef} className={`pickup-map ${className ?? ''}`} onMouseLeave={() => setActive(false)}>
      <iframe
        className="pickup-map__frame"
        src={EMBED_URL}
        title={`Пункт самовывоза на карте: ${PICKUP.city}, ${PICKUP.street}`}
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
      />
      {!active && (
        <button type="button" className="pickup-map__guard" onClick={() => setActive(true)}>
          <span className="pickup-map__hint">Нажмите, чтобы управлять картой</span>
        </button>
      )}
    </div>
  );
}
