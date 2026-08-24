import Link from 'next/link';
import './Footer.css';
import { SITE_EMAIL, SITE_HOURS, SITE_LEGAL, SITE_PHONES } from '@/config/siteInfo';

export function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <div className="footer__brand">
          <span className="footer__logo">
            santime
            <span className="logo-dot" aria-hidden="true" />
          </span>
          <p className="footer__text">2026 Santime. Интернет-магазин.</p>
        </div>

        <div className="footer__phones">
          <span className="footer__hours">
            {SITE_HOURS.label} {SITE_HOURS.value}
          </span>
          {SITE_PHONES.map((phone) => (
            <a key={phone.href} href={phone.href} className="footer__phone">
              {phone.display}
            </a>
          ))}
          <a href={SITE_EMAIL.href} className="footer__phone">
            {SITE_EMAIL.display}
          </a>
        </div>

        <nav className="footer__links" aria-label="Информация">
          <Link href="/delivery">Доставка</Link>
          <Link href="/payment">Оплата</Link>
          <Link href="/terms">Пользовательское соглашение</Link>
          <Link href="/privacy">Политика персональных данных</Link>
        </nav>
      </div>

      <div className="container">
        <address className="footer__legal">{SITE_LEGAL.join(' ')}</address>
      </div>
    </footer>
  );
}
