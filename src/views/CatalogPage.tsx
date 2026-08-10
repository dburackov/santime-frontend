'use client';

import './CatalogPage.css';
import '@/components/ui/Skeleton.css';
import { useCategories } from '@/queries/useCategories';
import { STOREFRONT_BLOCK_SIZE } from '@/hooks/catalogQuery';
import { ErrorState } from '@/components/ui/ErrorState';
import { CategoryTile, CategoryTileSkeleton } from '@/components/catalog/CategoryTile';

export function CatalogPage() {
  const { data: categories, isLoading, isError, refetch } = useCategories();

  return (
    <div className="container catalog-page">
      <h1 className="catalog-page__title">Каталог</h1>

      {isError && <ErrorState description="Не удалось загрузить категории." onRetry={refetch} />}

      {isLoading && (
        <div className="category-grid">
          {Array.from({ length: STOREFRONT_BLOCK_SIZE }).map((_, i) => (
            <CategoryTileSkeleton key={i} />
          ))}
        </div>
      )}

      {categories && (
        <div className="category-grid">
          {categories.map((category) => (
            <CategoryTile key={category.id} category={category} />
          ))}
        </div>
      )}
    </div>
  );
}
