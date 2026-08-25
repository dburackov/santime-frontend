'use client';

import './CatalogPage.css';
import { useCategories } from '@/queries/useCategories';
import { ErrorState } from '@/components/ui/ErrorState';
import { CatalogTiles } from '@/components/catalog/CatalogTiles';
import { CategoryBrowser } from '@/components/catalog/CategoryBrowser';

export function CatalogPage() {
  const { data: categories, isError, refetch } = useCategories();

  return (
    <div className="container catalog-page">
      <h1 className="catalog-page__title">Каталог</h1>

      {isError && <ErrorState description="Не удалось загрузить категории." onRetry={refetch} />}

      {/* Обе раскладки в разметке, видимость решает медиазапрос: ветвить рендер по ширине нельзя. */}
      {categories && (
        <>
          <div className="catalog-page__tiles">
            <CatalogTiles categories={categories} />
          </div>
          <div className="catalog-page__browser">
            <CategoryBrowser categories={categories} />
          </div>
        </>
      )}
    </div>
  );
}
