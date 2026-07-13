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
  /** Строка поиска в панели — скрыть для коротких списков (напр. числовых значений). */
  searchable?: boolean;
  /** Чекбокс/радио у пункта — скрыть, если достаточно подсветки выбранного цветом акцента. */
  showIndicator?: boolean;
  /** Подпись пункта "не выбрано" в одиночном списке — по умолчанию дублирует placeholder. */
  clearLabel?: string;
  /** Пункт "не выбрано" в одиночном списке — скрыть, если значение всегда должно быть выбрано. */
  allowClear?: boolean;
  ariaLabel?: string;
  id?: string;
}

export function SearchableSelect({
  options,
  selected,
  onChange,
  multiple = false,
  placeholder,
  searchPlaceholder = 'Поиск…',
  emptyLabel = 'Ничего не найдено',
  searchable = true,
  showIndicator = true,
  clearLabel = placeholder,
  allowClear = true,
  ariaLabel,
  id,
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
    if (open && searchable) searchInputRef.current?.focus();
  }, [open, searchable]);

  const filteredOptions = useMemo(() => {
    if (!searchable) return options;
    const query = search.trim().toLowerCase();
    if (!query) return options;
    return options.filter((option) => option.label.toLowerCase().includes(query));
  }, [options, search, searchable]);

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
        id={id}
        type="button"
        className={`searchable-select__trigger ${selectedLabels.length > 0 ? 'searchable-select__trigger--filled' : ''}`}
        onClick={() => (open ? close() : setOpen(true))}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={ariaLabel}
        title={selectedLabels.length > 2 ? selectedLabels.join(', ') : undefined}
      >
        <span className="searchable-select__summary">{summary}</span>
        <ChevronDownIcon width={16} height={16} className="searchable-select__chevron" />
      </button>

      {open && (
        <div className="searchable-select__panel">
          {searchable && (
            <input
              ref={searchInputRef}
              type="text"
              className="searchable-select__search"
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          )}
          <div className="searchable-select__list" role="listbox" aria-multiselectable={multiple}>
            {!multiple && allowClear && (
              <label
                className={`searchable-select__option ${selected.length === 0 ? 'searchable-select__option--selected' : ''}`}
                onClick={() => {
                  onChange([]);
                  close();
                }}
              >
                <span className="searchable-select__option-label">{clearLabel}</span>
                {showIndicator && <input type="radio" checked={selected.length === 0} readOnly />}
              </label>
            )}
            {filteredOptions.length === 0 && <div className="searchable-select__empty">{emptyLabel}</div>}
            {filteredOptions.map((option) => (
              <label
                className={`searchable-select__option ${selected.includes(option.value) ? 'searchable-select__option--selected' : ''}`}
                key={option.value}
                onClick={() => toggleValue(option.value)}
              >
                <span className="searchable-select__option-label">{option.label}</span>
                {option.count !== undefined && <span className="check-count">{option.count}</span>}
                {showIndicator && <input type={multiple ? 'checkbox' : 'radio'} checked={selected.includes(option.value)} readOnly />}
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
