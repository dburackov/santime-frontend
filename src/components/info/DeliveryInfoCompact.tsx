import './DeliveryInfoCompact.css';
import { CARRIER, COURIER, PICKUP } from '@/config/delivery';
import { TruckIcon } from '@/components/ui/icons';
import { InfoCompactCard, InfoCompactRow } from './InfoCompactCard';

/** Сводка условий доставки для страницы товара. */
export function DeliveryInfoCompact() {
  return (
    <InfoCompactCard
      icon={<TruckIcon width={18} height={18} strokeWidth={1.8} />}
      title="Доставка"
      more={{ label: 'Условия доставки и карта самовывоза', to: '/delivery' }}
    >
      <InfoCompactRow
        title="Курьером по Минску"
        note={COURIER.intervals.join(' или ')}
        aside={
          <>
            <span className="delivery-compact__price">{COURIER.price} Br</span>
            <span className="delivery-compact__free-note">от {COURIER.freeFrom} Br — бесплатно</span>
          </>
        }
      />
      <InfoCompactRow
        title="Самовывоз со склада"
        note={`${PICKUP.street}, ${PICKUP.hours}`}
        aside={<span className="delivery-compact__price delivery-compact__price--free">Бесплатно</span>}
      />
      <InfoCompactRow
        title="Транспортной компанией"
        note={CARRIER.term}
        aside={<span className="delivery-compact__price">от {CARRIER.priceFrom} Br</span>}
      />
    </InfoCompactCard>
  );
}
