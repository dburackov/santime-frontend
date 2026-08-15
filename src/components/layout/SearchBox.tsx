'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import './SearchBox.css';
import { CloseIcon, SearchIcon } from '@/components/ui/icons';
import { ProductPhoto } from '@/components/ui/ProductPhoto';
import { Price } from '@/components/ui/Price';
import { useProductSearch } from '@/queries/useProductSearch';

interface SearchBoxProps {
  autoFocus?: boolean;
  onNavigate?: () => void;
  /** Показать кнопку закрытия внутри поля, когда запрос пуст — для мобильного оверлея поиска. */
  onClose?: () => void;
  inputId?: string;
}

export function SearchBox({ autoFocus, onNavigate, onClose, inputId }: SearchBoxProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { results, isSearching, isQueryTooShort } = useProductSearch(query);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  function goToProduct(variantSlug: string) {
    setQuery('');
    setOpen(false);
    onNavigate?.();
    router.push(`/product/${variantSlug}`);
  }

  function handleTrailingClick() {
    if (query.length > 0) {
      setQuery('');
      setOpen(false);
      inputRef.current?.focus();
    } else {
      onClose?.();
    }
  }

  const showPanel = open && query.trim().length > 0;
  const showTrailingButton = query.length > 0 || Boolean(onClose);

  return (
    <div className="search-box" ref={rootRef}>
      <SearchIcon width={16} height={16} className="search-box__icon" />
      <input
        ref={inputRef}
        id={inputId}
        type="text"
        className="search-box__input"
        placeholder="Поиск товаров"
        value={query}
        autoFocus={autoFocus}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setOpen(true)}
      />

      {showTrailingButton && (
        <button
          type="button"
          className="search-box__clear"
          onClick={handleTrailingClick}
          aria-label={query.length > 0 ? 'Очистить поиск' : 'Закрыть поиск'}
        >
          <CloseIcon width={14} height={14} />
        </button>
      )}

      {showPanel && (
        <div className="search-box__panel">
          {isQueryTooShort && <div className="search-box__hint">Введите ещё символ…</div>}

          {!isQueryTooShort && isSearching && <div className="search-box__hint">Поиск…</div>}

          {!isQueryTooShort && !isSearching && results.length === 0 && (
            <div className="search-box__hint">Ничего не найдено</div>
          )}

          {!isQueryTooShort && !isSearching && results.length > 0 && (
            <ul className="search-box__list">
              {results.map((variant) => (
                <li key={variant.variantId}>
                  <button
                    type="button"
                    className="search-box__item"
                    onClick={() => goToProduct(variant.variantSlug)}
                  >
                    <ProductPhoto image={variant.images?.[0]} alt={variant.name} size="thumb" />
                    <div className="search-box__item-main">
                      <span className="search-box__item-title">{variant.name}</span>
                      {!variant.inStock && <span className="search-box__item-oos">Нет в наличии</span>}
                    </div>
                    <Price value={variant.price} oldValue={variant.oldPrice} size="sm" stacked />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
