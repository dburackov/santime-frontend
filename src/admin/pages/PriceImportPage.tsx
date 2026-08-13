'use client';

import { useRef } from 'react';
import type { ChangeEvent } from 'react';
import { useMutation } from '@tanstack/react-query';
import '@/admin/admin.css';
import './PriceImportPage.css';
import { importPrices } from '@/api/admin';
import { formError } from '@/admin/formErrors';
import { Button } from '@/components/ui/Button';
import { BoxIcon } from '@/components/ui/icons';

export function PriceImportPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const mutation = useMutation({
    mutationFn: (file: File) => importPrices(file),
  });

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    mutation.mutate(file);
  }

  const summary = mutation.data;

  return (
    <div className="admin-page price-import">
      <h1>Прайс-лист</h1>
      <p className="price-import__intro">
        Загрузите файл поставщика в формате .xlsx. Цены берутся из колонки «РРЦ» и проставляются товарам с
        совпадающим артикулом. Позиции с нулевой ценой снимаются с продажи, вернувшаяся цена возвращает их
        обратно. Артикулы, которых нет в каталоге, пропускаются.
      </p>

      {formError(mutation.error) && <div className="admin-banner-error">{formError(mutation.error)}</div>}

      <Button onClick={() => fileInputRef.current?.click()} disabled={mutation.isPending}>
        <BoxIcon width={16} height={16} />
        {mutation.isPending ? 'Загружаем…' : 'Выбрать файл'}
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        hidden
        onChange={handleFileChange}
      />

      {summary && (
        <div className="admin-banner-success price-import__summary">
          <dl>
            <div>
              <dt>Обновлено цен</dt>
              <dd className="mono-num">{summary.updated}</dd>
            </div>
            <div>
              <dt>Возвращено в продажу</dt>
              <dd className="mono-num">{summary.activated}</dd>
            </div>
            <div>
              <dt>Снято с продажи</dt>
              <dd className="mono-num">{summary.deactivated}</dd>
            </div>
            <div>
              <dt>Цена не изменилась</dt>
              <dd className="mono-num">{summary.unchanged}</dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  );
}
