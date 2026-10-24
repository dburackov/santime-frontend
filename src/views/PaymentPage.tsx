import './InfoLanding.css';
import { InfoHero } from '@/components/info/InfoHero';
import { InfoContactStrip } from '@/components/info/InfoContactStrip';
import { PaymentInfo } from '@/components/info/PaymentInfo';
import { SITE_EMAIL } from '@/config/siteInfo';

export function PaymentPage() {
  return (
    <div className="info-landing">
      <InfoHero
        title="Оплата"
        subtitle="Платите так, как удобно: курьеру наличными или картой, либо онлайн при оформлении заказа."
      />
      <div className="container info-landing__body">
        <PaymentInfo />
      </div>
      <InfoContactStrip
        title="Нужен счёт или безналичный расчёт?"
        text="Напишите нам — подготовим документы для организации."
        action={{ label: SITE_EMAIL.display, href: SITE_EMAIL.href }}
        link={{ label: 'Условия доставки', to: '/delivery' }}
      />
    </div>
  );
}
