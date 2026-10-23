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

/** Карта пункта самовывоза — встроенный OpenStreetMap, атрибуцию рисует сам iframe. */
export function PickupMap({ className }: { className?: string }) {
  return (
    <iframe
      className={className}
      src={EMBED_URL}
      title={`Пункт самовывоза на карте: ${PICKUP.city}, ${PICKUP.street}`}
      loading="lazy"
      referrerPolicy="strict-origin-when-cross-origin"
    />
  );
}
