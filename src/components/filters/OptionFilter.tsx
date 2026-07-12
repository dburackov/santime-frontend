import type { CatalogFilterAttributeResponse } from '@/api/types';
import './Filters.css';

interface OptionFilterProps {
  attribute: CatalogFilterAttributeResponse;
  selectedValues: string[];
  onChange: (values: string[]) => void;
}

export function OptionFilter({ attribute, selectedValues, onChange }: OptionFilterProps) {
  function toggle(value: string, checked: boolean) {
    if (checked) onChange([...selectedValues, value]);
    else onChange(selectedValues.filter((v) => v !== value));
  }

  return (
    <div className="filter-block">
      <div className="filter-block__title">{attribute.name}</div>
      {attribute.options?.map((option) => (
        <label className="check-row" key={option.value}>
          <span className="check-row__label">
            <input
              type="checkbox"
              checked={selectedValues.includes(option.value)}
              onChange={(e) => toggle(option.value, e.target.checked)}
            />
            {formatOptionLabel(attribute, option.value)}
          </span>
          <span className="check-count">{option.count}</span>
        </label>
      ))}
    </div>
  );
}

function formatOptionLabel(attribute: CatalogFilterAttributeResponse, value: string) {
  if (attribute.type === 'BOOLEAN') {
    return value === 'true' ? 'Да' : 'Нет';
  }
  return value;
}
