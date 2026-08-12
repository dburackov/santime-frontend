'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import '@/admin/admin.css';
import '@/admin/dragOrder.css';
import '@/components/filters/Filters.css';
import './BestsellersPage.css';
import {
  createBestseller,
  deleteBestseller,
  listBestsellers,
  reorderBestsellers,
} from '@/api/admin';
import type { BestsellerResponse } from '@/api/types';
import { useProductSearch } from '@/queries/useProductSearch';
import { Modal } from '@/admin/components/Modal';
import { ConfirmDialog } from '@/admin/components/ConfirmDialog';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { formError } from '@/admin/formErrors';
import { formatPrice } from '@/utils/price';
import { useDragOrder } from '@/admin/useDragOrder';
import { DragHandleIcon, PlusIcon, TrashIcon } from '@/components/ui/icons';

const QUERY_KEY = ['admin-bestsellers'];

export function BestsellersPage() {
  const queryClient = useQueryClient();
  const { data: items, isError, refetch } = useQuery({ queryKey: QUERY_KEY, queryFn: listBestsellers });

  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<BestsellerResponse | null>(null);

  const { results, isSearching, isQueryTooShort } = useProductSearch(search);

  function invalidate() {
    return queryClient.invalidateQueries({ queryKey: QUERY_KEY });
  }

  const addMutation = useMutation({ mutationFn: createBestseller, onSuccess: invalidate });
  const deleteMutation = useMutation({ mutationFn: deleteBestseller, onSuccess: invalidate });
  const reorderMutation = useMutation({ mutationFn: reorderBestsellers, onSuccess: invalidate });

  const { items: list, itemProps, handleProps } = useDragOrder(
    items,
    (item) => item.id,
    (ids) => reorderMutation.mutate(ids),
  );
  const alreadyAdded = new Set(list.map((item) => item.productVariantId));

  function add(variantId: number) {
    addMutation.mutate(
      { productVariantId: variantId, sortOrder: list.length },
      { onSuccess: () => setSearch('') },
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <h1>Хиты продаж</h1>
        <Button size="sm" onClick={() => setModalOpen(true)}>
          <PlusIcon width={16} height={16} />
          Добавить товар
        </Button>
      </div>

      <p className="admin-hint">
        На главную попадают первые 8 позиций. Товары снятых с публикации карточек в подборке не
        показываются, но и не удаляются отсюда.
      </p>

      {isError && <ErrorState description="Не удалось загрузить подборку." onRetry={refetch} />}

      {!isError && (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <colgroup>
              <col className="bestsellers-page__col--grip" />
              <col className="bestsellers-page__col--position" />
              <col className="bestsellers-page__col--product" />
              <col className="bestsellers-page__col--sku" />
              <col className="bestsellers-page__col--price" />
              <col className="bestsellers-page__col--actions" />
            </colgroup>
            <thead>
              <tr>
                <th />
                <th>№</th>
                <th>Товар</th>
                <th>SKU</th>
                <th>Цена</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {list.map((item, index) => (
                <tr key={item.id} {...itemProps(item.id)}>
                  <td className="drag-handle" {...handleProps(item.id)}>
                    <DragHandleIcon width={16} height={16} />
                  </td>
                  <td className="mono-num">{index + 1}</td>
                  <td>{item.productName}</td>
                  <td className="mono-num">{item.variantSku}</td>
                  <td className="mono-num">{formatPrice(item.price)}</td>
                  <td>
                    <div className="admin-table__actions">
                      <button
                        type="button"
                        className="admin-table__icon-btn admin-table__icon-btn--danger"
                        onClick={() => setDeleteTarget(item)}
                        aria-label="Убрать из подборки"
                      >
                        <TrashIcon width={16} height={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {list.length === 0 && <div className="admin-empty">Подборка пуста — на главной блок не показывается.</div>}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Добавить в хиты продаж"
        footer={
          <Button variant="secondary" size="sm" onClick={() => setModalOpen(false)}>
            Готово
          </Button>
        }
      >
        <div className="admin-form">
          {formError(addMutation.error) && <div className="admin-banner-error">{formError(addMutation.error)}</div>}

          <div className="admin-form-field">
            <label htmlFor="bestseller-search">Поиск товара</label>
            <input
              id="bestseller-search"
              className="filter-text-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Название товара"
              autoComplete="off"
            />
          </div>

          {isQueryTooShort && <div className="admin-empty">Введите хотя бы 2 символа.</div>}
          {isSearching && <div className="admin-empty">Ищем…</div>}
          {!isSearching && !isQueryTooShort && search.trim() && results.length === 0 && (
            <div className="admin-empty">Ничего не найдено.</div>
          )}

          {results.length > 0 && (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <colgroup>
                  <col className="bestsellers-page__col--found-product" />
                  <col className="bestsellers-page__col--found-price" />
                  <col className="bestsellers-page__col--found-action" />
                </colgroup>
                <tbody>
                  {results.map((variant) => (
                    <tr key={variant.variantId}>
                      <td>{variant.productName}</td>
                      <td className="mono-num">{formatPrice(variant.price)}</td>
                      <td>
                        <Button
                          size="sm"
                          onClick={() => add(variant.variantId)}
                          disabled={alreadyAdded.has(variant.variantId) || addMutation.isPending}
                        >
                          {alreadyAdded.has(variant.variantId) ? 'Уже в подборке' : 'Добавить'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Modal>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Убрать из хитов продаж?"
        description={`Товар «${deleteTarget?.productName}» пропадёт из подборки на главной. Сам товар останется в каталоге.`}
        onCancel={() => setDeleteTarget(null)}
        isPending={deleteMutation.isPending}
        onConfirm={() => {
          if (!deleteTarget) return;
          deleteMutation.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) });
        }}
      />
    </div>
  );
}
