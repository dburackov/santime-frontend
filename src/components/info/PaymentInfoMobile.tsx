import './PaymentInfoMobile.css';
import { BanknoteIcon, CardIcon } from '@/components/ui/icons';
import { InfoMobileCard } from './InfoMobileCard';

const METHODS = [
  { title: 'Наличными или картой курьеру', icon: <BanknoteIcon width={18} height={18} strokeWidth={1.8} /> },
  { title: 'Онлайн картой через E-POS', icon: <CardIcon width={18} height={18} strokeWidth={1.8} /> },
];

/** Оплата на мобильной карточке товара: только названия способов, подробности — по стрелке. */
export function PaymentInfoMobile() {
  return (
    <InfoMobileCard to="/payment" moreLabel="Подробнее об оплате">
      <ul className="payment-mobile">
        {METHODS.map((method) => (
          <li key={method.title} className="payment-mobile__row">
            <span className="payment-mobile__icon">{method.icon}</span>
            {method.title}
          </li>
        ))}
      </ul>
    </InfoMobileCard>
  );
}
