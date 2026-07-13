import { Link } from 'react-router-dom';
import './Footer.css';
import { SITE_PHONES } from '@/config/siteInfo';

export function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <div className="footer__brand">
          <span className="footer__logo">santime</span>
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
          <Link to="/dostavka">Доставка</Link>
          <Link to="/oplata">Оплата</Link>
          <Link to="/admin" className="footer__admin-link">
            Админ-панель
          </Link>
        </nav>
      </div>
    </footer>
  );
}
