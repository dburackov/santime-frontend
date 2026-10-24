'use client';

import './InfoBlocks.css';
import './DeliveryInfo.css';
import { Fragment, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { CARRIER, COURIER, PICKUP } from '@/config/delivery';
import { SITE_PHONES } from '@/config/siteInfo';
import { BoxIcon, CheckIcon, ChevronDownIcon, ClockIcon, PhoneIcon, TruckIcon, WarehouseIcon } from '@/components/ui/icons';
import { useScrollEnd } from '@/hooks/useScrollEnd';
import { CurrencySymbol } from '@/components/ui/CurrencySymbol';
import { formatPrice } from '@/utils/price';
import { PickupMap } from './PickupMap';

type MethodKey = 'courier' | 'pickup' | 'carrier';

const METHODS: { key: MethodKey; icon: ReactNode; title: string; note: string; free?: boolean }[] = [
  {
    key: 'courier',
    icon: <TruckIcon width={22} height={22} strokeWidth={1.7} />,
    title: 'Курьером',
    note: COURIER.zone,
  },
  {
    key: 'pickup',
    icon: <WarehouseIcon width={22} height={22} strokeWidth={1.7} />,
    title: 'Самовывоз',
    note: 'Бесплатно',
    free: true,
  },
  {
    key: 'carrier',
    icon: <BoxIcon width={22} height={22} strokeWidth={1.7} />,
    title: 'Транспортные компании',
    note: 'Вся Беларусь',
  },
];

const RULES = [
  {
    title: 'Проверка при получении',
    text: 'Вскройте упаковку при курьере, осмотрите товар на сколы и трещины, проверьте комплектацию.',
  },
  {
    title: 'До подъезда',
    text: 'Доставка выполняется до подъезда. Подъём в квартиру — платная услуга, согласуйте её заранее.',
  },
];

const columnWidth = (width: number) => ({ '--info-column': `${width}px` }) as CSSProperties;

/** Полный блок условий доставки для страницы /delivery. */
export function DeliveryInfo() {
  const courierRef = useRef<HTMLDivElement>(null);
  const pickupRef = useRef<HTMLDivElement>(null);
  const carrierRef = useRef<HTMLDivElement>(null);
  const [highlighted, setHighlighted] = useState<MethodKey | null>(null);
  const scrollEnd = useScrollEnd();

  // Плитка способа ведёт к своему блоку условий: докручиваем, а когда прокрутка
  // закончилась — подсвечиваем блок, иначе анимация отыграла бы за кадром.
  const showMethod = (key: MethodKey) => {
    const target = { courier: courierRef, pickup: pickupRef, carrier: carrierRef }[key].current;
    if (!target) return;

    setHighlighted(null);
    // Прокрутка от прошлого клика ещё может идти — её подсветка уже не нужна.
    scrollEnd.cancel();

    // Блок уже целиком на экране (ниже липкой шапки) — крутить нечего, подсвечиваем сразу.
    const rect = target.getBoundingClientRect();
    const headerOffset = parseFloat(getComputedStyle(target).scrollMarginTop) || 0;
    if (rect.top >= headerOffset && rect.bottom <= window.innerHeight) {
      requestAnimationFrame(() => setHighlighted(key));
      return;
    }

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // Блок выше экрана (самовывоз с картой на мобильном) прижимаем к верху, остальные — по центру.
    const fits = target.offsetHeight < window.innerHeight * 0.8;
    target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: fits ? 'center' : 'start' });

    scrollEnd.wait(window, () => setHighlighted(key));
  };

  const highlightProps = (key: MethodKey) => ({
    'data-highlighted': highlighted === key || undefined,
    onAnimationEnd: () => setHighlighted((current) => (current === key ? null : current)),
  });

  return (
    <div className="info-blocks">
      <div className="info-blocks__grid" style={columnWidth(260)}>
        {METHODS.map((method) => (
          <button
            key={method.key}
            type="button"
            className="info-card delivery-method"
            onClick={() => showMethod(method.key)}
          >
            <span className="info-icon">{method.icon}</span>
            <span className="info-card__title">{method.title}</span>
            <span className="delivery-method__footer">
              <span className={`delivery-method__note${method.free ? ' delivery-method__note--free' : ''}`}>
                {method.note}
              </span>
              <span className="delivery-method__more">
                Подробнее
                <ChevronDownIcon width={14} height={14} />
              </span>
            </span>
          </button>
        ))}
      </div>

      <section className="info-blocks__group">
        <h2 className="info-blocks__heading">Стоимость и сроки</h2>
        <div className="info-blocks__grid">
          <div className="info-card tariff info-highlight" ref={courierRef} {...highlightProps('courier')}>
            <div className="tariff__head">
              <span className="tariff__zone">{COURIER.zone}</span>
              <span className="tariff__tag">курьер</span>
            </div>
            <div className="tariff__body">
              <div className="tariff__price-row">
                <span className="tariff__price">
                  {formatPrice(COURIER.price)} <CurrencySymbol />
                </span>
                <span className="tariff__price-note">при заказе до {COURIER.freeFrom} <CurrencySymbol /></span>
              </div>
              <div className="tariff__badge tariff__badge--free">
                <CheckIcon width={16} height={16} />
                {/* Текст — одним элементом: иначе знак валюты становится отдельным
                    flex-элементом, отъезжает на gap и встаёт по центру, а не по базовой линии. */}
                <span>
                  Бесплатно при заказе от {COURIER.freeFrom} <CurrencySymbol />
                </span>
              </div>
              <div className="tariff__details">
                <span className="tariff__details-main">Интервалы: {COURIER.intervals.join(' и ')}</span>
                <span className="tariff__details-note">{COURIER.cutoffNote}</span>
              </div>
            </div>
          </div>

          <div className="info-card tariff info-highlight" ref={carrierRef} {...highlightProps('carrier')}>
            <div className="tariff__head">
              <span className="tariff__zone">{CARRIER.zone}</span>
              <span className="tariff__tag">Транспортная компания</span>
            </div>
            <div className="tariff__body">
              <div className="tariff__price-row">
                <span className="tariff__price">
                  от {formatPrice(CARRIER.priceFrom)} <CurrencySymbol />
                </span>
                <span className="tariff__price-note">по тарифам ТК</span>
              </div>
              <div className="tariff__badge">
                <ClockIcon width={16} height={16} />
                {CARRIER.term}
              </div>
              <div className="tariff__details">
                <span className="tariff__details-main">Точную стоимость назовёт менеджер</span>
                <span className="tariff__details-note">
                  Расчёт зависит от веса, объёма и удалённости населённого пункта.
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="info-blocks__group">
        <h2 className="info-blocks__heading">Пункт самовывоза</h2>
        <div className="pickup info-highlight" ref={pickupRef} {...highlightProps('pickup')}>
          <div className="info-card pickup__info">
            <div className="pickup__address">
              <span className="pickup__label">Адрес</span>
              <span className="pickup__street">
                {PICKUP.city}, {PICKUP.street}
              </span>
            </div>
            <div className="pickup__contacts">
              <div className="pickup__row">
                <ClockIcon width={17} height={17} strokeWidth={1.8} />
                <span>
                  {PICKUP.hours}
                  <br />
                  <span className="pickup__muted">{PICKUP.hoursNote}</span>
                </span>
              </div>
              <div className="pickup__row">
                <PhoneIcon width={17} height={17} strokeWidth={1.8} />
                <span>
                  Перед выездом позвоните
                  {SITE_PHONES.map((phone) => (
                    <Fragment key={phone.href}>
                      <br />
                      <a href={phone.href} className="pickup__phone">
                        {phone.display}
                      </a>
                    </Fragment>
                  ))}
                </span>
              </div>
            </div>
            <p className="pickup__storage">{PICKUP.storageNote}</p>
          </div>
          <PickupMap className="pickup__map" />
        </div>
      </section>

      <section className="info-blocks__group">
        <h2 className="info-blocks__heading">Условия приёмки</h2>
        <ol className="info-blocks__grid">
          {RULES.map((rule, index) => (
            <li key={rule.title} className="info-card rule">
              <span className="rule__num" aria-hidden="true">
                {index + 1}
              </span>
              <span className="rule__body">
                <span className="rule__title">{rule.title}</span>
                <span className="info-card__text">{rule.text}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
