import { Link } from 'react-router-dom';
import './HomePage.css';
import '@/components/ui/Skeleton.css';
import { useCategories } from '@/queries/useCategories';
import { ErrorState } from '@/components/ui/ErrorState';

export function HomePage() {
  const { data: categories, isLoading, isError, refetch } = useCategories();

  return (
    <div>
      <section className="hero">
        <div className="container hero__content">
          <h1 className="hero__title">Товары, которым можно доверять</h1>
          <p className="hero__subtitle">
            Каталог с точными характеристиками и понятными фильтрами — находите нужный товар быстро.
          </p>
          <a href="#categories" className="btn btn--primary hero__cta">
            Смотреть каталог
          </a>
        </div>
      </section>

      <section className="container home-categories" id="categories">
        <h2 className="home-categories__title">Категории</h2>

        {isError && <ErrorState description="Не удалось загрузить категории." onRetry={refetch} />}

        {isLoading && (
          <div className="home-categories__grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton-block home-category-tile home-category-tile--skeleton" />
            ))}
          </div>
        )}

        {categories && (
          <div className="home-categories__grid">
            {categories.map((category) => (
              <Link key={category.id} to={`/category/${category.slug}`} className="home-category-tile">
                <span className="home-category-tile__name">{category.name}</span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
