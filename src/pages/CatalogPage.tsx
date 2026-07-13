import { Link } from 'react-router-dom';
import '@/pages/HomePage.css';
import '@/components/ui/Skeleton.css';
import { useCategories } from '@/queries/useCategories';
import { ErrorState } from '@/components/ui/ErrorState';

export function CatalogPage() {
  const { data: categories, isLoading, isError, refetch } = useCategories();

  return (
    <div className="container home-categories">
      <h1 className="home-categories__title">Каталог</h1>

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
    </div>
  );
}
