import './DeliveryInfoCompact.css';
import { CARRIER, COURIER, PICKUP, isCourierFree } from '@/config/delivery';
import { TruckIcon } from '@/components/ui/icons';
import { CurrencySymbol } from '@/components/ui/CurrencySymbol';
import { InfoCompactCard, InfoCompactRow } from './InfoCompactCard';

interface DeliveryInfoCompactProps {
  /** Сумма заказа этого товара (цена × количество): от неё зависит, бесплатен ли курьер. */
  orderTotal: number;
}

/** Сводка условий доставки для страницы товара. */
export function DeliveryInfoCompact({ orderTotal }: DeliveryInfoCompactProps) {
  const courierFree = isCourierFree(orderTotal);

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
          courierFree ? (
            <>
              <span className="delivery-compact__price delivery-compact__price--free">Бесплатно</span>
              <span className="delivery-compact__price-note">для заказа от {COURIER.freeFrom} <CurrencySymbol /></span>
            </>
          ) : (
            <>
              <span className="delivery-compact__price">{COURIER.price} <CurrencySymbol /></span>
              <span className="delivery-compact__free-note">от {COURIER.freeFrom} <CurrencySymbol /> — бесплатно</span>
            </>
          )
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
        aside={<span className="delivery-compact__price">от {CARRIER.priceFrom} <CurrencySymbol /></span>}
      />
    </InfoCompactCard>
  );
}
