'use client';

import { useEffect } from 'react';
import './FilterPanel.css';
import { CloseIcon } from '@/components/ui/icons';
import { Button } from '@/components/ui/Button';
import { formatProductsCount } from '@/utils/plural';
import { splitOptionValues } from '@/utils/attributes';
import { NumberRangeFilter } from './NumberRangeFilter';
import { BooleanFilter } from './BooleanFilter';
import { OptionFilter } from './OptionFilter';
import { PriceRangeFilter } from './PriceRangeFilter';
import { BrandFilter } from './BrandFilter';
import { CategoryFacetFilter } from './CategoryFacetFilter';
import type {
  BrandResponse,
  CatalogFilterAttributeResponse,
  SearchCategoryFacetResponse,
} from '@/api/types';
import type { CatalogQueryState } from '@/hooks/useCatalogQueryState';

interface FilterPanelProps {
  filters: CatalogFilterAttributeResponse[];
  brands: BrandResponse[];
  /** Фасет разделов — только у страницы поиска: в каталоге раздел задаёт сам URL. */
  categories?: SearchCategoryFacetResponse[];
  state: CatalogQueryState;
  open: boolean;
  onClose: () => void;
  resultCount?: number;
}

export function FilterPanel({
  filters,
  brands,
  categories,
  state,
  open,
  onClose,
  resultCount,
}: FilterPanelProps) {
  useEffect(() => {
    if (!open) return;
    document.body.classList.add('no-scroll');
    return () => document.body.classList.remove('no-scroll');
  }, [open]);

  return (
    <>
      <div className={`filter-drawer ${open ? 'filter-drawer--open' : ''}`}>
        <div className="filter-drawer__backdrop" onClick={onClose} />
        <div className="filter-drawer__sheet" role="dialog" aria-modal="true" aria-label="Фильтры">
          <div className="filter-drawer__header">
            <h2>Фильтры</h2>
            {state.hasActiveFilters && (
              <button type="button" className="filter-drawer__reset" onClick={state.resetAllFilters}>
                Сбросить
              </button>
            )}
            <button type="button" className="touch-target" onClick={onClose} aria-label="Закрыть фильтры">
              <CloseIcon width={18} height={18} />
            </button>
          </div>

          <div className="filter-drawer__body">
            <div className="filter-drawer__filters">
              <CategoryFacetFilter
                categories={categories ?? []}
                categoryIds={state.categoryIds}
                onChange={(ids) => state.updateParams({ categoryIds: ids.join(',') || undefined })}
              />

              <PriceRangeFilter
                priceMin={state.priceMin}
                priceMax={state.priceMax}
                onChange={(min, max) => state.updateParams({ priceMin: min?.toString(), priceMax: max?.toString() })}
              />

              <BrandFilter
                brands={brands}
                brandIds={state.brandIds}
                onChange={(brandIds) => state.updateParams({ brandIds: brandIds.join(',') || undefined })}
              />

              {filters.map((attribute) => {
                switch (attribute.type) {
                  case 'NUMBER':
                    return (
                      <NumberRangeFilter
                        key={attribute.slug}
                        attribute={attribute}
                        min={state.attributeRangeFilters[attribute.slug]?.min}
                        max={state.attributeRangeFilters[attribute.slug]?.max}
                        onChange={(min, max) =>
                          state.updateParams({
                            [`${attribute.slug}_min`]: min?.toString(),
                            [`${attribute.slug}_max`]: max?.toString(),
                          })
                        }
                      />
                    );
                  case 'BOOLEAN':
                    return (
                      <BooleanFilter
                        key={attribute.slug}
                        attribute={attribute}
                        checked={state.attributeFilters[attribute.slug] === 'true'}
                        onChange={(checked) =>
                          state.updateParams({ [attribute.slug]: checked ? 'true' : undefined })
                        }
                      />
                    );
                  case 'OPTION':
                    return (
                      <OptionFilter
                        key={attribute.slug}
                        attribute={attribute}
                        selectedValues={splitOptionValues(
                          state.attributeFilters[attribute.slug] ?? '',
                          (attribute.options ?? []).map((option) => option.value),
                        )}
                        onChange={(values) => state.updateParams({ [attribute.slug]: values.join(',') || undefined })}
                      />
                    );
                  default:
                    return null;
                }
              })}

              <div className="filter-block">
                <label className="toggle-row">
                  <span>Только в наличии</span>
                  <span className="toggle">
                    <input
                      type="checkbox"
                      className="visually-hidden"
                      checked={state.inStock}
                      onChange={(e) => state.updateParams({ inStock: e.target.checked ? undefined : 'false' })}
                    />
                    <span className="toggle__track" aria-hidden="true">
                      <span className="toggle__knob" />
                    </span>
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Полоса нужна только открытой шторке: кнопка «Фильтры» переехала в тулбар
          списка (FilterToggle). */}
      {open && (
        <div className="filter-mobile-bar">
          <Button onClick={onClose} className="filter-mobile-bar__apply">
            {resultCount !== undefined ? `Показать ${formatProductsCount(resultCount)}` : 'Показать товары'}
          </Button>
        </div>
      )}
    </>
  );
}
