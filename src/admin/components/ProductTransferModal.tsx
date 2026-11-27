'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProductGroup, listProductGroups, previewProductTransfer, transferProducts } from '@/api/admin';
import type { ProductGroupRowResponse, ProductTransferPreview, ProductImageAdminResponse } from '@/api/types';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { groupTitle } from '@/admin/productGroupTitle';
import { formatWarrantyYears } from '@/utils/warranty';
import { formError } from '@/admin/formErrors';
import { Modal } from './Modal';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { Pagination } from '@/components/ui/Pagination';
import './ProductTransferModal.css';

interface Props {
  target: ProductGroupRowResponse;
  onCreate: () => void;
  onConfigure: () => void;
  onClose: () => void;
}

function toggle(ids: number[], id: number) {
  return ids.includes(id) ? ids.filter(value => value !== id) : [...ids, id];
}

function Photo({ image }: { image: ProductImageAdminResponse }) {
  return <img className="product-transfer__photo" src={image.originalUrl} alt={image.altText ?? 'Общее фото'} />;
}

export function ProductTransferModal({ target, onCreate, onConfigure, onClose }: Props) {
  const [step, setStep] = useState<'action' | 'search' | 'select' | 'review'>('action');
  const [term, setTerm] = useState('');
  const search = useDebouncedValue(term.trim(), 300);
  const [page, setPage] = useState(0);
  const [sourceId, setSourceId] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [keepImageIds, setKeepImageIds] = useState<number[]>([]);
  const client = useQueryClient();
  const candidates = useQuery({
    queryKey: ['admin-product-groups', 'transfer', target.categoryId, search, page],
    queryFn: () => listProductGroups({ categoryId: target.categoryId, search, page, size: 10 }),
    enabled: step === 'search' && target.axes.length > 0,
  });
  const source = useQuery({
    queryKey: ['admin-product-group', sourceId],
    queryFn: () => getProductGroup(sourceId!),
    enabled: step === 'select' && sourceId !== null,
  });
  const preview = useMutation({
    mutationFn: () => previewProductTransfer(target.id, { sourceGroupId: sourceId!, variantIds: selectedIds }),
    onSuccess: ({ details }) => {
      const wholeModel = details.selected.length === details.source.count;
      setKeepImageIds(wholeModel ? details.source.images.map(image => image.id) : []);
      setStep('review');
    },
  });
  const confirm = useMutation({
    mutationFn: (review: ProductTransferPreview) => transferProducts(target.id, {
      selection: { sourceGroupId: review.details.source.id, variantIds: review.details.selected.map(item => item.id) },
      revision: review.revision,
      keepImageIds,
    }),
    onSuccess: async () => {
      await Promise.all(['admin-product-groups', 'admin-product-group', 'admin-group-images',
        'admin-products-all', 'admin-variant', 'catalog-products', 'product-detail', 'similar-products']
        .map(key => client.invalidateQueries({ queryKey: [key] })));
      onClose();
    },
  });

  const title = groupTitle(target);
  const results = candidates.data?.content.filter(group => group.id !== target.id);
  const details = preview.data?.details;
  const merging = details && details.selected.length === details.source.count;
  const blocked = merging && details.source.promoCodes.length > 0;
  const busy = preview.isPending || confirm.isPending;

  function back() {
    confirm.reset();
    preview.reset();
    if (step === 'review') setStep('select');
    if (step === 'select') setStep('search');
    if (step === 'search') setStep('action');
  }

  return (
    <Modal open title={step === 'action' ? 'Добавить исполнение' : 'Добавить существующие товары'}
      size={step === 'action' ? 'default' : 'wide'} onClose={() => { if (!busy) onClose(); }}
      footer={step !== 'action' && <>
        <Button size="sm" variant="secondary" disabled={busy} onClick={back}>Назад</Button>
        {step === 'select' && <Button size="sm" disabled={busy || !selectedIds.length || source.isError}
          onClick={() => preview.mutate()}>Проверить перенос</Button>}
        {step === 'review' && preview.data && <Button size="sm" disabled={busy || !!blocked || confirm.isError}
          onClick={() => confirm.mutate(preview.data)}>Перенести ({details?.selected.length})</Button>}
      </>}>
      <div className="admin-form product-transfer">
        {step !== 'review' && <p>{title}</p>}
        {step === 'action' && <div className="product-transfer__actions">
          <Button size="sm" onClick={onCreate}>Создать новое исполнение</Button>
          <Button size="sm" variant="secondary" onClick={() => setStep('search')}>Добавить существующие товары</Button>
        </div>}
        {step === 'search' && (target.axes.length === 0 ? <>
          <p>Укажите, по каким характеристикам покупатель будет выбирать исполнение этой модели.</p>
          <Button size="sm" onClick={onConfigure}>Настроить различия исполнений</Button>
        </> : <>
          <div className="admin-form-field">
            <label htmlFor="transfer-search">Найти товар в этой категории</label>
            <input id="transfer-search" className="filter-text-input" value={term} placeholder="Название или артикул"
              onChange={e => { setTerm(e.target.value); setPage(0); }} />
          </div>
          {candidates.isLoading && <p>Загрузка товаров…</p>}
          {candidates.isError && <ErrorState description="Не удалось загрузить товары." onRetry={candidates.refetch} />}
          {results?.length === 0 && <p>Других моделей на этой странице не найдено.</p>}
          {results?.map(group => <button type="button" key={group.id} className="product-transfer__result"
            onClick={() => {
              setSourceId(group.id);
              setSelectedIds(group.variantTotal === 1 ? [group.variants[0].id] : []);
              setStep('select');
            }}>
            <strong>{groupTitle(group)}</strong>
            <span>Исполнений: {group.variantTotal}</span>
          </button>)}
          {candidates.data && <Pagination page={page} totalPages={candidates.data.totalPages} onChange={setPage} />}
        </>)}
        {step === 'select' && <>
          {source.isLoading && <p>Загрузка исполнений…</p>}
          {source.isError && <ErrorState description="Не удалось загрузить модель." onRetry={source.refetch} />}
          {source.data && <>
            <h3>Какие товары перенести?</h3>
            <label className="admin-form-checkbox">
              <input type="checkbox" disabled={busy}
                checked={source.data.variants.every(item => selectedIds.includes(item.id))}
                onChange={e => { preview.reset(); setSelectedIds(e.target.checked ? source.data.variants.map(v => v.id) : []); }} />
              Выбрать все исполнения ({source.data.variants.length})
            </label>
            {source.data.variants.map(item => <label className="admin-form-checkbox" key={item.id}>
              <input type="checkbox" disabled={busy} checked={selectedIds.includes(item.id)}
                onChange={() => { preview.reset(); setSelectedIds(ids => toggle(ids, item.id)); }} />
              {item.name}
            </label>)}
          </>}
        </>}
        {step === 'review' && details && <>
          <p>В модели <strong>«{groupTitle(details.target)}»</strong> после переноса будет исполнений: {details.target.count + details.selected.length}.</p>
          <p>Из модели «{groupTitle(details.source)}» {merging ? 'переносятся все исполнения. Пустая модель будет удалена.' :
            'переносится часть исполнений. Останется: ' + (details.source.count - details.selected.length) + '.'}</p>
          <ul>{details.selected.map(item => <li key={item.id}>{item.name}</li>)}</ul>
          <p>Различающие характеристики: {details.target.axes.join(', ')}.</p>
          {details.source.brand !== details.target.brand && <p>Бренд: {details.source.brand ?? 'Без бренда'} → {details.target.brand ?? 'Без бренда'}</p>}
          {details.source.warrantyYears !== details.target.warrantyYears && (
            <p>Гарантия: {details.source.warrantyYears == null ? 'Не указана' : formatWarrantyYears(details.source.warrantyYears)}
              {' → '}{details.target.warrantyYears == null ? 'Не указана' : formatWarrantyYears(details.target.warrantyYears)}</p>
          )}
          {details.source.description !== details.target.description && <div>
            <h3>Описание модели</h3>
            <p>Было: {details.source.description || 'Пусто'}</p>
            <p>Станет: {details.target.description || 'Пусто'}</p>
          </div>}
          {(details.target.images.length > 0 || details.source.images.length > 0) && <>
            <h3>Общие фото принимающей модели ({details.target.images.length})</h3>
            <div className="product-transfer__photos">{details.target.images.map(image => <Photo key={image.id} image={image} />)}</div>
            {details.source.images.length > 0 && (merging ? <>
              <p>Отметьте общие фото исходной модели, которые нужно сохранить. Остальные будут удалены вместе с моделью.</p>
              <div className="product-transfer__photos">{details.source.images.map((image, i) =>
                <label className="admin-form-checkbox" key={image.id}>
                  <input type="checkbox" disabled={busy} checked={keepImageIds.includes(image.id)}
                    aria-label={'Сохранить фото ' + (i + 1)} onChange={() => setKeepImageIds(ids => toggle(ids, image.id))} />
                  <Photo image={image} />
                </label>)}</div>
            </> : <>
              <p>Общие фото, которые останутся у исходной модели</p>
              <div className="product-transfer__photos">{details.source.images.map(image => <Photo key={image.id} image={image} />)}</div>
            </>)}
          </>}
          {(details.source.promoCodes.length > 0 || details.target.promoCodes.length > 0) && <>
            <p>Промокоды, привязанные к исходной модели: {details.source.promoCodes.join(', ') || 'нет'}.
              У принимающей модели: {details.target.promoCodes.join(', ') || 'нет'}.</p>
            {blocked && <p className="admin-banner-error">Перед переносом последнего исполнения измените область действия кодов
              в разделе <Link href="/admin/promo-codes">«Промокоды»</Link>.</p>}
          </>}
        </>}
        {(preview.isError || confirm.isError) && <p role="alert" className="admin-banner-error">
          {formError(preview.error ?? confirm.error)}{confirm.isError && ' Вернитесь к выбору и повторите проверку.'}
        </p>}
      </div>
    </Modal>
  );
}
