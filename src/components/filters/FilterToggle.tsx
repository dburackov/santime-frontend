'use client';

import './FilterToggle.css';
import { FilterIcon } from '@/components/ui/icons';

interface FilterToggleProps {
  hasActiveFilters: boolean;
  onClick: () => void;
}

export function FilterToggle({ hasActiveFilters, onClick }: FilterToggleProps) {
  return (
    <button type="button" className="filter-toggle" onClick={onClick}>
      <FilterIcon width={18} height={18} />
      Фильтры
      {hasActiveFilters && <span className="filter-toggle__dot" />}
    </button>
  );
}
