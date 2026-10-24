import './InfoLanding.css';
import { InfoHero } from '@/components/info/InfoHero';
import { InfoContactStrip } from '@/components/info/InfoContactStrip';
import { DeliveryInfo } from '@/components/info/DeliveryInfo';
import { SITE_PHONES } from '@/config/siteInfo';

export function DeliveryPage() {
  const phone = SITE_PHONES[0];

  return (
    <div className="info-landing page-in">
      <InfoHero
        title="Доставка"
        subtitle="Своя курьерская служба в Минске, транспортные компании по регионам и самовывоз со склада."
      />
      <div className="container info-landing__body">
        <DeliveryInfo />
      </div>
      <InfoContactStrip
        title="Остались вопросы по доставке?"
        text="Позвоните — рассчитаем стоимость и подберём удобный интервал."
        action={{ label: phone.display, href: phone.href }}
        link={{ label: 'Способы оплаты', to: '/payment' }}
      />
    </div>
  );
}
