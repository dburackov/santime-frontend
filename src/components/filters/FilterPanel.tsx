'use client';

import { useEffect } from 'react';
import './FilterPanel.css';
import { CloseIcon, FilterIcon, RefreshIcon } from '@/components/ui/icons';
import { Button } from '@/components/ui/Button';
import { NumberRangeFilter } from './NumberRangeFilter';
import { BooleanFilter } from './BooleanFilter';
import { OptionFilter } from './OptionFilter';
import { PriceRangeFilter } from './PriceRangeFilter';
import { BrandFilter } from './BrandFilter';
import type { BrandResponse, CatalogFilterAttributeResponse } from '@/api/types';
import type { CatalogQueryState } from '@/hooks/useCatalogQueryState';

interface FilterPanelProps {
  filters: CatalogFilterAttributeResponse[];
  brands: BrandResponse[];
  state: CatalogQueryState;
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  resultCount?: number;
}

export function FilterPanel({ filters, brands, state, open, onOpen, onClose, resultCount }: FilterPanelProps) {
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
            <button type="button" className="touch-target" onClick={onClose} aria-label="Закрыть фильтры">
              <CloseIcon width={18} height={18} />
            </button>
          </div>

          <div className="filter-drawer__body">
            <div className="filter-drawer__filters">
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
                        selectedValues={(state.attributeFilters[attribute.slug] ?? '').split(',').filter(Boolean)}
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

      <div className="filter-mobile-bar">
        {open ? (
          <>
            <Button onClick={onClose} className="filter-mobile-bar__apply">
              {resultCount !== undefined ? `Показать ${resultCount} товаров` : 'Показать товары'}
            </Button>
            {state.hasActiveFilters && (
              <button
                type="button"
                className="filter-mobile-bar__reset"
                onClick={state.resetAllFilters}
                aria-label="Сбросить фильтры"
              >
                <RefreshIcon width={18} height={18} />
              </button>
            )}
            <button type="button" className="filter-mobile-bar__close" onClick={onClose} aria-label="Закрыть фильтры">
              <CloseIcon width={18} height={18} />
            </button>
          </>
        ) : (
          <button type="button" className="filter-mobile-bar__toggle" onClick={onOpen}>
            <FilterIcon width={16} height={16} />
            Фильтры
            {state.hasActiveFilters && <span className="filter-mobile-bar__dot" />}
          </button>
        )}
      </div>
    </>
  );
}
