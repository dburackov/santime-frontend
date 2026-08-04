import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { NotFoundPage } from '@/views/NotFoundPage';

/**
 * Корневой not-found: отдаёт настоящий HTTP 404. Раньше SPA на любой
 * несуществующий URL отвечала 200 с разметкой каталога — краулер считал такие
 * страницы валидными и складывал их в индекс.
 *
 * Шапка и подвал дублируются здесь потому, что not-found.tsx на корневом уровне
 * рендерится вне layout группы (shop).
 */
export default function NotFound() {
  return (
    <div className="app-shell">
      <Header />
      <main className="app-shell__main">
        <NotFoundPage />
      </main>
      <Footer />
    </div>
  );
}
