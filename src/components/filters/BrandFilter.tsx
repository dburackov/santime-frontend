import type { BrandResponse } from '@/api/types';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import './Filters.css';

interface BrandFilterProps {
  brands: BrandResponse[];
  brandIds: number[];
  onChange: (brandIds: number[]) => void;
}

export function BrandFilter({ brands, brandIds, onChange }: BrandFilterProps) {
  if (brands.length === 0) return null;

  return (
    <div className="filter-block">
      <div className="filter-block__title">Бренд</div>
      <SearchableSelect
        options={brands.map((brand) => ({ value: String(brand.id), label: brand.name }))}
        selected={brandIds.map(String)}
        onChange={(values) => onChange(values.map(Number))}
        multiple
        placeholder="Все бренды"
        searchPlaceholder="Поиск бренда…"
        portal
      />
    </div>
  );
}
