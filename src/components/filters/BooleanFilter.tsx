import type { CatalogFilterAttributeResponse } from '@/api/types';
import './Filters.css';

interface BooleanFilterProps {
  attribute: CatalogFilterAttributeResponse;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function BooleanFilter({ attribute, checked, onChange }: BooleanFilterProps) {
  return (
    <div className="filter-block">
      <label className="toggle-row">
        <span>{attribute.name}</span>
        <span className="toggle">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            className="visually-hidden"
          />
          <span className="toggle__track" aria-hidden="true">
            <span className="toggle__knob" />
          </span>
        </span>
      </label>
    </div>
  );
}
