import { Link } from 'react-router-dom';
import './Footer.css';

export function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <span className="footer__logo">Santime</span>
        <p className="footer__text">© {new Date().getFullYear()} Santime. Интернет-магазин.</p>
        <Link to="/admin" className="footer__admin-link">
          Админ-панель
        </Link>
      </div>
    </footer>
  );
}
