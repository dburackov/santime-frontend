import './Footer.css';

export function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <span className="footer__logo">Santime</span>
        <p className="footer__text">© {new Date().getFullYear()} Santime. Интернет-магазин.</p>
      </div>
    </footer>
  );
}
