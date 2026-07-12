import type { BrandResponse } from '@/api/types';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import './Filters.css';

interface BrandFilterProps {
  brands: BrandResponse[];
  brandId: number | undefined;
  onChange: (brandId: number | undefined) => void;
}

export function BrandFilter({ brands, brandId, onChange }: BrandFilterProps) {
  if (brands.length === 0) return null;

  return (
    <div className="filter-block">
      <div className="filter-block__title">Бренд</div>
      <SearchableSelect
        options={brands.map((brand) => ({ value: String(brand.id), label: brand.name }))}
        selected={brandId !== undefined ? [String(brandId)] : []}
        onChange={(values) => onChange(values[0] ? Number(values[0]) : undefined)}
        placeholder="Все бренды"
        searchPlaceholder="Поиск бренда…"
      />
    </div>
  );
}
