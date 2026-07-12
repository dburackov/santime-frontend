import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDownIcon } from './icons';
import './SearchableSelect.css';

export interface SearchableSelectOption {
  value: string;
  label: string;
  count?: number;
}

interface SearchableSelectProps {
  options: SearchableSelectOption[];
  selected: string[];
  onChange: (values: string[]) => void;
  multiple?: boolean;
  placeholder: string;
  searchPlaceholder?: string;
  emptyLabel?: string;
}

export function SearchableSelect({
  options,
  selected,
  onChange,
  multiple = false,
  placeholder,
  searchPlaceholder = 'Поиск…',
  emptyLabel = 'Ничего не найдено',
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  function close() {
    setOpen(false);
    setSearch('');
  }

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        close();
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') close();
    }
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (open) searchInputRef.current?.focus();
  }, [open]);

  const filteredOptions = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return options;
    return options.filter((option) => option.label.toLowerCase().includes(query));
  }, [options, search]);

  const selectedLabels = options.filter((option) => selected.includes(option.value)).map((option) => option.label);

  function toggleValue(value: string) {
    if (multiple) {
      if (selected.includes(value)) onChange(selected.filter((v) => v !== value));
      else onChange([...selected, value]);
    } else {
      onChange(selected.includes(value) ? [] : [value]);
      close();
    }
  }

  const summary =
    selectedLabels.length === 0
      ? placeholder
      : selectedLabels.length <= 2
        ? selectedLabels.join(', ')
        : `${selectedLabels.slice(0, 2).join(', ')} +${selectedLabels.length - 2}`;

  return (
    <div className="searchable-select" ref={rootRef}>
      <button
        type="button"
        className={`searchable-select__trigger ${selectedLabels.length > 0 ? 'searchable-select__trigger--filled' : ''}`}
        onClick={() => (open ? close() : setOpen(true))}
        aria-expanded={open}
        aria-haspopup="listbox"
        title={selectedLabels.length > 2 ? selectedLabels.join(', ') : undefined}
      >
        <span className="searchable-select__summary">{summary}</span>
        <ChevronDownIcon width={16} height={16} className="searchable-select__chevron" />
      </button>

      {open && (
        <div className="searchable-select__panel">
          <input
            ref={searchInputRef}
            type="text"
            className="searchable-select__search"
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="searchable-select__list" role="listbox" aria-multiselectable={multiple}>
            {!multiple && (
              <label
                className="searchable-select__option"
                onClick={() => {
                  onChange([]);
                  close();
                }}
              >
                <span className="searchable-select__option-label">{placeholder}</span>
                <input type="radio" checked={selected.length === 0} readOnly />
              </label>
            )}
            {filteredOptions.length === 0 && <div className="searchable-select__empty">{emptyLabel}</div>}
            {filteredOptions.map((option) => (
              <label className="searchable-select__option" key={option.value} onClick={() => toggleValue(option.value)}>
                <span className="searchable-select__option-label">{option.label}</span>
                {option.count !== undefined && <span className="check-count">{option.count}</span>}
                <input type={multiple ? 'checkbox' : 'radio'} checked={selected.includes(option.value)} readOnly />
              </label>
            ))}
          </div>
          {multiple && selectedLabels.length > 0 && (
            <button type="button" className="searchable-select__clear" onClick={() => onChange([])}>
              Очистить выбор
            </button>
          )}
        </div>
      )}
    </div>
  );
}
