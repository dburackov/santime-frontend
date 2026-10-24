import { CardIcon } from '@/components/ui/icons';
import { PAYMENT_METHODS } from '@/config/payment';
import { InfoCompactCard, InfoCompactRow } from './InfoCompactCard';

/** Сводка способов оплаты для страницы товара. */
export function PaymentInfoCompact() {
  return (
    <InfoCompactCard
      icon={<CardIcon width={18} height={18} strokeWidth={1.8} />}
      title="Оплата"
      more={{ label: 'Все способы оплаты', to: '/payment' }}
    >
      {PAYMENT_METHODS.map((method) => (
        <InfoCompactRow key={method.key} title={method.shortTitle} note={method.text} />
      ))}
    </InfoCompactCard>
  );
}
