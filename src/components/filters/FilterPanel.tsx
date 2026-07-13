import './FilterPanel.css';
import { CloseIcon } from '@/components/ui/icons';
import { Button } from '@/components/ui/Button';
import { StringFilter } from './StringFilter';
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
  onClose: () => void;
  resultCount?: number;
}

export function FilterPanel({ filters, brands, state, open, onClose, resultCount }: FilterPanelProps) {
  return (
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
                case 'STRING':
                  return (
                    <StringFilter
                      key={attribute.slug}
                      attribute={attribute}
                      value={state.attributeFilters[attribute.slug]}
                      onChange={(value) => state.updateParams({ [attribute.slug]: value })}
                    />
                  );
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

          {state.hasActiveFilters && (
            <button type="button" className="filter-panel__reset" onClick={state.resetAllFilters}>
              Сбросить всё
            </button>
          )}
        </div>

        <div className="filter-drawer__footer">
          <Button onClick={onClose} className="filter-drawer__apply">
            {resultCount !== undefined ? `Показать ${resultCount} товаров` : 'Показать товары'}
          </Button>
        </div>
      </div>
    </div>
  );
}
