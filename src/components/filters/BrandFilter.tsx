import type { BrandResponse } from '@/api/types';
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
      <select
        className="filter-select"
        value={brandId ?? ''}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : undefined)}
      >
        <option value="">Все бренды</option>
        {brands.map((brand) => (
          <option key={brand.id} value={brand.id}>
            {brand.name}
          </option>
        ))}
      </select>
    </div>
  );
}
