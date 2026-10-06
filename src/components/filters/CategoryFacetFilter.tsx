import type { SearchCategoryFacetResponse } from '@/api/types';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import './Filters.css';

interface CategoryFacetFilterProps {
  categories: SearchCategoryFacetResponse[];
  categoryIds: number[];
  onChange: (categoryIds: number[]) => void;
}

export function CategoryFacetFilter({ categories, categoryIds, onChange }: CategoryFacetFilterProps) {
  if (categories.length === 0) return null;

  return (
    <div className="filter-block">
      <div className="filter-block__title">Категория</div>
      <SearchableSelect
        options={categories.map((category) => ({
          value: String(category.id),
          label: category.name,
          count: category.count,
        }))}
        selected={categoryIds.map(String)}
        onChange={(values) => onChange(values.map(Number))}
        multiple
        placeholder="Все категории"
        searchPlaceholder="Поиск категории…"
      />
    </div>
  );
}
