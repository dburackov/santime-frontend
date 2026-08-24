'use client';

import './CatalogPage.css';
import { useCategories } from '@/queries/useCategories';
import { ErrorState } from '@/components/ui/ErrorState';
import { CategoryBrowser } from '@/components/catalog/CategoryBrowser';

export function CatalogPage() {
  const { data: categories, isError, refetch } = useCategories();

  return (
    <div className="container catalog-page">
      <h1 className="catalog-page__title">Каталог</h1>

      {isError && <ErrorState description="Не удалось загрузить категории." onRetry={refetch} />}

      {categories && <CategoryBrowser categories={categories} />}
    </div>
  );
}
