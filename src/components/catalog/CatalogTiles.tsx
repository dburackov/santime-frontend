import Link from 'next/link';
import './CatalogTiles.css';
import { ProductPhoto } from '@/components/ui/ProductPhoto';
import { ArrowRightIcon } from '@/components/ui/icons';
import { formatProductsCount } from '@/utils/plural';
import { getRootCategories, getSubcategories } from '@/utils/categoryTree';
import type { CategoryResponse } from '@/api/types';

interface CatalogTilesProps {
  categories: CategoryResponse[];
}

/**
 * Десктопная раскладка каталога: плитка на корневую категорию. Ниже 900px её
 * подменяет CategoryBrowser с погружением по уровням — переключение чисто в CSS,
 * потому что первый клиентский рендер обязан совпасть с серверным.
 */
export function CatalogTiles({ categories }: CatalogTilesProps) {
  return (
    <div className="catalog-tiles">
      {getRootCategories(categories).map((category) => {
        const subcategories = getSubcategories(categories, category.id);

        return (
          <div className="catalog-tile" key={category.id}>
            <Link href={`/category/${category.slug}`} className="catalog-tile__photo" tabIndex={-1} aria-hidden="true">
              <ProductPhoto image={category.image} alt={category.name} size="tile" />
            </Link>

            <div className="catalog-tile__body">
              <Link href={`/category/${category.slug}`} className="catalog-tile__title">
                <span className="catalog-tile__name">{category.name}</span>
                <span className="catalog-tile__count">{formatProductsCount(category.productCount)}</span>
              </Link>

              {subcategories.length > 0 && (
                <div className="catalog-tile__subs">
                  {subcategories.map((sub) => (
                    <Link href={`/category/${sub.slug}`} className="catalog-tile__sub" key={sub.id}>
                      <span>{sub.name}</span>
                      {sub.productCount > 0 && (
                        <span className="catalog-tile__sub-count">{sub.productCount}</span>
                      )}
                    </Link>
                  ))}
                </div>
              )}

              <Link href={`/category/${category.slug}`} className="catalog-tile__cta">
                {subcategories.length > 0 ? `Все ${category.name.toLowerCase()}` : 'Смотреть товары'}
                <ArrowRightIcon width={14} height={14} />
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}
