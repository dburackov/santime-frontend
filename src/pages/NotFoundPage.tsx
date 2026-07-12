import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="container" style={{ padding: '64px 16px', textAlign: 'center' }}>
      <h1>Страница не найдена</h1>
      <p style={{ color: 'var(--color-slate)', marginTop: 'var(--space-3)' }}>
        Проверьте адрес или вернитесь в каталог.
      </p>
      <Link
        to="/"
        style={{
          display: 'inline-block',
          marginTop: 'var(--space-6)',
          color: 'var(--color-accent)',
          fontWeight: 500,
        }}
      >
        На главную
      </Link>
    </div>
  );
}
