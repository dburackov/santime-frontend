'use client';

import { useState } from 'react';
import type { KeyboardEvent } from 'react';
import { useMutation } from '@tanstack/react-query';
import '@/components/filters/Filters.css';
import './ExternalSourceField.css';
import { previewExternalProduct } from '@/api/admin';
import type { ExternalProductResponse } from '@/api/types';
import { Button } from '@/components/ui/Button';
import { formError } from '@/admin/formErrors';

interface ExternalSourceFieldProps {
  /** Категория формы: от неё зависит, какие характеристики вообще можно заполнить. */
  categoryId: string;
  onFilled: (data: ExternalProductResponse) => void;
}

export function ExternalSourceField({ categoryId, onFilled }: ExternalSourceFieldProps) {
  const [url, setUrl] = useState('');
  const [result, setResult] = useState<ExternalProductResponse | null>(null);

  const mutation = useMutation({
    mutationFn: () => previewExternalProduct({ url, categoryId: Number(categoryId) }),
    onSuccess: (data) => {
      setResult(data);
      onFilled(data);
    },
  });

  const disabled = !categoryId || url.trim() === '' || mutation.isPending;

  function fill() {
    if (disabled) return;
    setResult(null);
    mutation.mutate();
  }

  // Поле живёт внутри формы товара: Enter иначе отправил бы её целиком.
  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    fill();
  }

  return (
    <div className="external-source">
      <label className="external-source__label" htmlFor="external-source-url">
        Заполнить из внешнего источника
      </label>
      <div className="external-source__row">
        <input
          id="external-source-url"
          className="filter-text-input external-source__input"
          type="url"
          placeholder="https://sanit.by/…"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <Button type="button" variant="secondary" size="sm" onClick={fill} disabled={disabled}>
          {mutation.isPending ? 'Загружаю…' : 'Заполнить'}
        </Button>
      </div>

      {!categoryId && (
        <span className="external-source__hint">Сначала выберите категорию — от неё зависит набор характеристик.</span>
      )}

      {formError(mutation.error) && (
        <span className="admin-form-error">{formError(mutation.error)}</span>
      )}

      {result && (
        <div className="external-source__result">
          <span className="external-source__done">
            Заполнено. Артикул и slug задайте сами.
          </span>
          {result.brandId === null && result.brandName !== '' && (
            <span className="external-source__hint">
              Бренд «{result.brandName}» не найден — заведите его в разделе «Бренды».
            </span>
          )}
          {result.skipped.length > 0 && (
            <>
              <span className="external-source__hint">Не перенесено:</span>
              <ul className="external-source__skipped">
                {result.skipped.map((item) => (
                  <li key={item.label}>
                    {item.label}: {item.value} — {item.reason}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
}
