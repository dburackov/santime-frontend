import './ProductHelpPromo.css';
import { SITE_EMAIL, SITE_PHONES } from '@/config/siteInfo';

/** Золотая полоса внизу страницы товара: предложение позвонить или написать. */
export function ProductHelpPromo() {
  const phone = SITE_PHONES[0];

  return (
    <section className="product-help-promo">
      <div className="container product-help-promo__inner">
        <div className="product-help-promo__text">
          <h2 className="product-help-promo__title">Не уверены, что Вам подойдёт?</h2>
          <p className="product-help-promo__lead">Подскажем по размерам, установке и комплектации.</p>
        </div>
        <div className="product-help-promo__actions">
          <a href={phone.href} className="product-help-promo__button product-help-promo__button--gold">
            {phone.display}
          </a>
          <a href={SITE_EMAIL.href} className="product-help-promo__button product-help-promo__button--outline">
            {SITE_EMAIL.display}
          </a>
        </div>
      </div>
    </section>
  );
}
