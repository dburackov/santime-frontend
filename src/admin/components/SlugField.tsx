'use client';

import '@/components/filters/Filters.css';
import './SlugField.css';
import { RequiredMark } from '@/admin/components/RequiredMark';
import { RefreshIcon } from '@/components/ui/icons';
import { isValidSlug, SLUG_HINT, SLUG_PATTERN, slugify } from '@/utils/slug';

interface SlugFieldProps {
  id: string;
  value: string;
  /** Название, из которого кнопка собирает slug. */
  source: string;
  onChange: (slug: string) => void;
  required?: boolean;
  error?: string;
  /** Ограничение длины у сущности, если оно жёстче общего. */
  maxLength?: number;
}

export function SlugField({ id, value, source, onChange, required, error, maxLength = 255 }: SlugFieldProps) {
  // Серверная ошибка приходит только после отправки — до неё подсказываем сами.
  const shownError = error ?? (value !== '' && !isValidSlug(value) ? SLUG_HINT : undefined);

  return (
    <div className="admin-form-field">
      <label htmlFor={id}>Slug{required && <RequiredMark />}</label>
      <div className="slug-field__row">
        <input
          id={id}
          className="filter-text-input mono-num slug-field__input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          pattern={SLUG_PATTERN}
          maxLength={maxLength}
          title={SLUG_HINT}
          required
        />
        <button
          type="button"
          className="slug-field__generate"
          onClick={() => onChange(slugify(source))}
          disabled={slugify(source) === ''}
          title="Сгенерировать из названия"
          aria-label="Сгенерировать slug из названия"
        >
          <RefreshIcon width={16} height={16} />
        </button>
      </div>
      {shownError && <span className="admin-form-error">{shownError}</span>}
    </div>
  );
}
