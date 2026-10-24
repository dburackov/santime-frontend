'use client';

import './DeliveryInfoMobile.css';
import { useId, useRef, useState, type KeyboardEvent } from 'react';
import { CARRIER, COURIER, PICKUP, isCourierFree } from '@/config/delivery';
import { InfoMobileCard } from './InfoMobileCard';

const TABS = ['Курьер', 'Самовывоз', 'ТК'] as const;

interface DeliveryPanel {
  price: string;
  free: boolean;
  note: string;
}

/** Курьер бесплатен от порога, поэтому его панель зависит от суммы заказа. */
function deliveryPanel(tab: number, orderTotal: number): DeliveryPanel {
  if (tab === 1) return { price: 'Бесплатно', free: true, note: `${PICKUP.street}, ${PICKUP.hours}` };
  if (tab === 2) return { price: `от ${CARRIER.priceFrom} Br`, free: false, note: 'по тарифам транспортной компании' };
  return isCourierFree(orderTotal)
    ? { price: 'Бесплатно', free: true, note: `для заказа от ${COURIER.freeFrom} Br, иначе ${COURIER.price} Br` }
    : { price: `${COURIER.price} Br`, free: false, note: `бесплатно при заказе от ${COURIER.freeFrom} Br` };
}

interface DeliveryInfoMobileProps {
  /** Сумма заказа этого товара (цена × количество) — та же, что в нижнем баре. */
  orderTotal: number;
}

/** Доставка на мобильной карточке товара: переключатель способа и цена выбранного. */
export function DeliveryInfoMobile({ orderTotal }: DeliveryInfoMobileProps) {
  const [tab, setTab] = useState(0);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const baseId = useId();
  const panel = deliveryPanel(tab, orderTotal);

  // Стрелки по вкладкам — обычная клавиатурная модель tablist: фокус и выбор едут вместе.
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
    if (!step) return;
    event.preventDefault();
    const next = (tab + step + TABS.length) % TABS.length;
    setTab(next);
    tabRefs.current[next]?.focus();
  };

  return (
    <InfoMobileCard to="/delivery" moreLabel="Подробнее о доставке">
      <div className="delivery-mobile__tabs" role="tablist" aria-label="Способ доставки" onKeyDown={handleKeyDown}>
        {TABS.map((label, index) => (
          <button
            key={label}
            ref={(element) => {
              tabRefs.current[index] = element;
            }}
            type="button"
            role="tab"
            id={`${baseId}-tab-${index}`}
            aria-selected={tab === index}
            aria-controls={`${baseId}-panel`}
            tabIndex={tab === index ? 0 : -1}
            className="delivery-mobile__tab"
            onClick={() => setTab(index)}
          >
            {label}
          </button>
        ))}
      </div>
      <div
        className="delivery-mobile__panel"
        role="tabpanel"
        id={`${baseId}-panel`}
        aria-labelledby={`${baseId}-tab-${tab}`}
      >
        <span className={`delivery-mobile__price${panel.free ? ' delivery-mobile__price--free' : ''}`}>
          {panel.price}
        </span>
        <span className="delivery-mobile__note">{panel.note}</span>
      </div>
    </InfoMobileCard>
  );
}
