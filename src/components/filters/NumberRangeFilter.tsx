import type { CatalogFilterAttributeResponse } from '@/api/types';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import './Filters.css';

interface NumberRangeFilterProps {
  attribute: CatalogFilterAttributeResponse;
  min: number | undefined;
  max: number | undefined;
  onChange: (min: number | undefined, max: number | undefined) => void;
}

export function NumberRangeFilter({ attribute, min, max, onChange }: NumberRangeFilterProps) {
  const values = attribute.values ?? [];
  if (values.length === 0) return null;

  const unit = attribute.unit ? ` ${attribute.unit}` : '';
  // "От" не может быть больше выбранного "до" и наоборот — сужаем списки вместо валидации.
  const minOptions = values.filter((value) => max === undefined || Number(value) <= max);
  const maxOptions = values.filter((value) => min === undefined || Number(value) >= min);

  return (
    <div className="filter-block">
      <div className="filter-block__title">{attribute.name}</div>
      <div className="price-range-inputs">
        <SearchableSelect
          options={minOptions.map((value) => ({ value, label: `${value}${unit}` }))}
          selected={min !== undefined ? [String(min)] : []}
          onChange={(selected) => onChange(selected[0] !== undefined ? Number(selected[0]) : undefined, max)}
          placeholder="От"
          clearLabel=""
          searchable={false}
          showIndicator={false}
          portal
        />
        <span className="price-range-inputs__dash">—</span>
        <SearchableSelect
          options={maxOptions.map((value) => ({ value, label: `${value}${unit}` }))}
          selected={max !== undefined ? [String(max)] : []}
          onChange={(selected) => onChange(min, selected[0] !== undefined ? Number(selected[0]) : undefined)}
          placeholder="До"
          clearLabel=""
          searchable={false}
          showIndicator={false}
          portal
        />
      </div>
    </div>
  );
}
