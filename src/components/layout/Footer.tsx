import Link from 'next/link';
import './Footer.css';
import { SITE_PHONES } from '@/config/siteInfo';

export function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <div className="footer__brand">
          <span className="footer__logo">
            santime
            <span className="logo-dot" aria-hidden="true" />
          </span>
          <p className="footer__text">© {new Date().getFullYear()} Santime. Интернет-магазин.</p>
        </div>

        <div className="footer__phones">
          {SITE_PHONES.map((phone) => (
            <a key={phone.href} href={phone.href} className="footer__phone">
              {phone.display}
            </a>
          ))}
        </div>

        <nav className="footer__links" aria-label="Информация">
          <Link href="/dostavka">Доставка</Link>
          <Link href="/oplata">Оплата</Link>
        </nav>
      </div>
    </footer>
  );
}
