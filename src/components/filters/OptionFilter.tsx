import type { CatalogFilterAttributeResponse } from '@/api/types';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import './Filters.css';

interface OptionFilterProps {
  attribute: CatalogFilterAttributeResponse;
  selectedValues: string[];
  onChange: (values: string[]) => void;
}

export function OptionFilter({ attribute, selectedValues, onChange }: OptionFilterProps) {
  return (
    <div className="filter-block">
      <div className="filter-block__title">{attribute.name}</div>
      <SearchableSelect
        multiple
        options={(attribute.options ?? []).map((option) => ({
          value: option.value,
          label: formatOptionLabel(attribute, option.value),
          count: option.count,
        }))}
        selected={selectedValues}
        onChange={onChange}
        placeholder="Любой"
        searchPlaceholder={`Поиск: ${attribute.name.toLowerCase()}`}
        portal
      />
    </div>
  );
}

function formatOptionLabel(attribute: CatalogFilterAttributeResponse, value: string) {
  if (attribute.type === 'BOOLEAN') {
    return value === 'true' ? 'Да' : 'Нет';
  }
  return value;
}
