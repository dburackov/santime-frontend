'use client';

import { useEffect, useRef, useState, type FormEvent, type MouseEvent as ReactMouseEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import './SearchBox.css';
import { isUsableSearchTerm, normalizeSearchTerm } from '@/hooks/catalogQuery';
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
  const rootRef = useRef<HTMLFormElement>(null);
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

  function handleProductClick(e: ReactMouseEvent<HTMLAnchorElement>) {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    setQuery('');
    setOpen(false);
    onNavigate?.();
  }

  /**
   * Enter в поле и кнопка «Перейти к результатам» идут одним путём через submit формы:
   * нативный submit даёт кнопку «Поиск» на мобильной клавиатуре и корректно ведёт себя
   * при IME-композиции, чего onKeyDown по e.key не обеспечивает.
   */
  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const term = normalizeSearchTerm(query);
    if (!isUsableSearchTerm(term)) return;
    setOpen(false);
    // Иначе на мобильном поле остаётся в фокусе и клавиатура закрывает выдачу.
    inputRef.current?.blur();
    onNavigate?.();
    // Строку в поле, в отличие от goToProduct, не чистим: пользователь остаётся
    // на выдаче по этому запросу, и пустое поле читалось бы как потеря запроса.
    router.push(`/search?q=${encodeURIComponent(term)}`);
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

  const normalizedQuery = normalizeSearchTerm(query);
  const showPanel = open && normalizedQuery.length > 0;
  const showTrailingButton = query.length > 0 || Boolean(onClose);
  // Кнопка показывается и при нулевой выдаче — выход на /search должен быть всегда.
  const showGoToResults = isUsableSearchTerm(normalizedQuery);

  return (
    <form className="search-box" role="search" ref={rootRef} onSubmit={handleSubmit}>
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
                  <Link
                    href={`/product/${variant.variantSlug}`}
                    className="search-box__item"
                    onClick={handleProductClick}
                  >
                    <ProductPhoto image={variant.images?.[0]} alt={variant.name} size="thumb" />
                    <div className="search-box__item-main">
                      <span className="search-box__item-title">{variant.name}</span>
                      {!variant.inStock && <span className="search-box__item-oos">Нет в наличии</span>}
                    </div>
                    <Price value={variant.price} oldValue={variant.oldPrice} size="sm" stacked />
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {showGoToResults && (
            <button type="submit" className="search-box__go">
              Перейти к результатам поиска
            </button>
          )}
        </div>
      )}
    </form>
  );
}
