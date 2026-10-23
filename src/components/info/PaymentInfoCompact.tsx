import { CardIcon } from '@/components/ui/icons';
import { InfoCompactCard, InfoCompactRow } from './InfoCompactCard';

/** Сводка способов оплаты для страницы товара. */
export function PaymentInfoCompact() {
  return (
    <InfoCompactCard
      icon={<CardIcon width={18} height={18} strokeWidth={1.8} />}
      title="Оплата"
      more={{ label: 'Все способы оплаты', to: '/payment' }}
    >
      <InfoCompactRow
        title="Наличными или картой курьеру"
        note="Расчёт в белорусских рублях курьеру — наличными либо картой через мобильный терминал."
      />
      <InfoCompactRow
        title="Онлайн картой через E-POS"
        note="Оплата банковской картой при оформлении заказа через систему E-POS."
      />
    </InfoCompactCard>
  );
}
