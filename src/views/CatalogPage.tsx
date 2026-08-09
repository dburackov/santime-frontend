'use client';

import '@/views/HomePage.css';
import '@/components/ui/Skeleton.css';
import { useCategories } from '@/queries/useCategories';
import { ErrorState } from '@/components/ui/ErrorState';
import { CategoryTile, CategoryTileSkeleton } from '@/components/catalog/CategoryTile';

export function CatalogPage() {
  const { data: categories, isLoading, isError, refetch } = useCategories();

  return (
    <div className="container home-categories">
      <h1 className="home-categories__title">Каталог</h1>

      {isError && <ErrorState description="Не удалось загрузить категории." onRetry={refetch} />}

      {isLoading && (
        <div className="home-categories__grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <CategoryTileSkeleton key={i} />
          ))}
        </div>
      )}

      {categories && (
        <div className="home-categories__grid">
          {categories.map((category) => (
            <CategoryTile key={category.id} category={category} />
          ))}
        </div>
      )}
    </div>
  );
}
