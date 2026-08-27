'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDownIcon } from './icons';
import './SearchableSelect.css';

export interface SearchableSelectOption {
  value: string;
  label: string;
  count?: number;
  /** Текст на кнопке, если он отличается от подписи пункта в списке. */
  summaryLabel?: string;
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
  /** Открывать панель в портале (document.body) с фиксированным позиционированием —
   * чтобы её не обрезал overflow:auto у контейнера-предка (например, тело модалки). */
  portal?: boolean;
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
  portal = false,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [panelStyle, setPanelStyle] = useState<{ top?: number; bottom?: number; left: number; width: number } | null>(
    null,
  );
  const [openUp, setOpenUp] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  function close() {
    setOpen(false);
    setSearch('');
  }

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(e: MouseEvent) {
      const target = e.target as Node;
      if (rootRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      close();
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
    // preventScroll — иначе браузер сам решает прокрутить ближайший скроллящийся
    // предок к полю поиска, конфликтуя с нашим позиционированием панели (см. portal).
    //
    // Только для мыши: на тач-экране автофокус поднимает экранную клавиатуру поверх
    // половины списка, хотя пользователь ещё не собирался ничего искать.
    if (!open || !searchable) return;
    if (!window.matchMedia('(pointer: fine)').matches) return;
    searchInputRef.current?.focus({ preventScroll: true });
  }, [open, searchable]);

  useLayoutEffect(() => {
    if (!open) return;

    let rafId: number | null = null;
    let lastRect: { top: number; bottom: number; left: number; width: number } | null = null;

    function measurePosition() {
      rafId = null;
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;

      // Скролл где угодно на странице (capture: true) долетает сюда, даже если
      // триггер не сдвинулся ни на пиксель — не пересчитываем позицию впустую.
      if (
        lastRect &&
        lastRect.top === rect.top &&
        lastRect.bottom === rect.bottom &&
        lastRect.left === rect.left &&
        lastRect.width === rect.width
      ) {
        return;
      }
      lastRect = { top: rect.top, bottom: rect.bottom, left: rect.left, width: rect.width };

      const panelHeight = panelRef.current?.offsetHeight ?? 0;
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      // Раскрываем вверх, только если снизу панель не помещается, а сверху места больше —
      // иначе по умолчанию всегда вниз, даже если наверху чуть просторнее.
      const shouldOpenUp = spaceBelow < panelHeight + 4 && spaceAbove > spaceBelow;
      setOpenUp(shouldOpenUp);
      if (portal) {
        setPanelStyle(
          shouldOpenUp
            ? { bottom: window.innerHeight - rect.top + 4, left: rect.left, width: rect.width }
            : { top: rect.bottom + 4, left: rect.left, width: rect.width },
        );
      }
    }

    function scheduleUpdate() {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(measurePosition);
    }

    measurePosition();
    window.addEventListener('resize', scheduleUpdate);
    window.addEventListener('scroll', scheduleUpdate, { capture: true, passive: true });
    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      window.removeEventListener('resize', scheduleUpdate);
      window.removeEventListener('scroll', scheduleUpdate, true);
    };
  }, [open, portal]);

  const filteredOptions = useMemo(() => {
    if (!searchable) return options;
    const query = search.trim().toLowerCase();
    if (!query) return options;
    return options.filter((option) => option.label.toLowerCase().includes(query));
  }, [options, search, searchable]);

  const selectedLabels = useMemo(
    () =>
      options
        .filter((option) => selected.includes(option.value))
        .map((option) => option.summaryLabel ?? option.label),
    [options, selected],
  );

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

  const panel = open && (
        <div
          className={`searchable-select__panel ${portal ? 'searchable-select__panel--portal' : ''} ${openUp ? 'searchable-select__panel--up' : ''}`}
          ref={panelRef}
          style={portal ? (panelStyle ?? { top: 0, left: 0, visibility: 'hidden' }) : undefined}
        >
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
      );

  return (
    <div className="searchable-select" ref={rootRef}>
      <button
        ref={triggerRef}
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

      {/* panel === false, пока список закрыт. Проверка на него обязательна:
          без неё createPortal дёргал бы document.body и на сервере, где его нет.
          Открыть список можно только кликом, то есть уже в браузере. */}
      {portal && panel ? createPortal(panel, document.body) : panel}
    </div>
  );
}
