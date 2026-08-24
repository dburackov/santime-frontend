'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import '@/admin/admin.css';
import '@/components/filters/Filters.css';
import './PromoCodesPage.css';
import {
  listPromoCodes,
  createPromoCode,
  updatePromoCode,
  deletePromoCode,
  listCategories,
  listBrands,
  listProductGroups,
} from '@/api/admin';
import type { DiscountType, PromoCodeRequest, PromoCodeResponse } from '@/api/types';
import { PUBLIC_PROMO_CODES_QUERY_KEY } from '@/queries/promoQueryKeys';
import { useAdminResource } from '@/admin/useAdminResource';
import { Modal } from '@/admin/components/Modal';
import { ConfirmDialog } from '@/admin/components/ConfirmDialog';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { Price } from '@/components/ui/Price';
import { CurrencySymbol } from '@/components/ui/CurrencySymbol';
import { Select } from '@/components/ui/Select';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { fieldError, formError } from '@/admin/formErrors';
import { groupTitle } from '@/admin/productGroupTitle';
import { PlusIcon, EditIcon, TrashIcon } from '@/components/ui/icons';
import { blurOnWheel } from '@/utils/numberInput';

const QUERY_KEY = ['admin-promo-codes'];

/** Товаров в каталоге немного, поэтому список для выбора грузится разом и ищется на клиенте. */
const PRODUCTS_PAGE_SIZE = 200;

interface FormState {
  code: string;
  description: string;
  discountType: DiscountType;
  discountValue: string;
  minOrderAmount: string;
  validFrom: string;
  validUntil: string;
  active: boolean;
  publicVisible: boolean;
  categoryIds: string[];
  brandIds: string[];
  productIds: string[];
}

const EMPTY_FORM: FormState = {
  code: '',
  description: '',
  discountType: 'PERCENT',
  discountValue: '',
  minOrderAmount: '',
  validFrom: '',
  validUntil: '',
  active: true,
  publicVisible: false,
  categoryIds: [],
  brandIds: [],
  productIds: [],
};

/** «2026-06-01T00:00:00» → «2026-06-01T00:00»: datetime-local не понимает секунды. */
function toInputValue(value: string | null): string {
  return value ? value.slice(0, 16) : '';
}

function formatDateTime(value: string | null): string {
  return value ? new Date(value).toLocaleString('ru-RU') : '—';
}

function formatPeriod(promo: PromoCodeResponse): string {
  if (!promo.validFrom && !promo.validUntil) return 'бессрочно';
  if (!promo.validFrom) return `до ${formatDateTime(promo.validUntil)}`;
  if (!promo.validUntil) return `с ${formatDateTime(promo.validFrom)}`;
  return `${formatDateTime(promo.validFrom)} — ${formatDateTime(promo.validUntil)}`;
}

function formatScope(promo: PromoCodeResponse): string {
  const parts = [
    promo.categoryIds.length && `${promo.categoryIds.length} катег.`,
    promo.brandIds.length && `${promo.brandIds.length} бренд.`,
    promo.productIds.length && `${promo.productIds.length} тов.`,
  ].filter(Boolean);
  return parts.length === 0 ? 'весь заказ' : parts.join(', ');
}

export function PromoCodesPage() {
  const queryClient = useQueryClient();

  // Промокод меняет и витрину: снятый с публикации код должен исчезнуть из
  // слайдера, не дожидаясь пятиминутного staleTime у usePublicPromoCodes.
  function invalidatePublic() {
    return queryClient.invalidateQueries({ queryKey: PUBLIC_PROMO_CODES_QUERY_KEY });
  }

  const { items, isLoading, isError, refetch, createMutation, updateMutation, deleteMutation } = useAdminResource<
    PromoCodeResponse,
    PromoCodeRequest
  >({
    queryKey: QUERY_KEY,
    list: listPromoCodes,
    create: async (body) => {
      const created = await createPromoCode(body);
      invalidatePublic();
      return created;
    },
    update: async (id, body) => {
      const updated = await updatePromoCode(id, body);
      invalidatePublic();
      return updated;
    },
    remove: async (id) => {
      await deletePromoCode(id);
      invalidatePublic();
    },
  });

  const { data: categories } = useQuery({ queryKey: ['admin-categories'], queryFn: () => listCategories() });
  const { data: brands } = useQuery({ queryKey: ['admin-brands'], queryFn: listBrands });
  const { data: productsPage } = useQuery({
    queryKey: ['admin-products-all'],
    queryFn: () => listProductGroups({ size: PRODUCTS_PAGE_SIZE }),
  });

  // Скоуп промокода — на группу («эта модель во всех исполнениях»), и эндпоинт уже отдаёт
  // модели. Сортировка по имени только на клиенте: у группы своего имени в базе нет.
  const products = productsPage
    ? productsPage.content
        .map((group) => ({ groupId: group.id, name: groupTitle(group.variants) }))
        .sort((a, b) => a.name.localeCompare(b.name, 'ru'))
    : undefined;
  const productsTruncated = productsPage ? productsPage.totalElements > productsPage.content.length : false;

  const [editing, setEditing] = useState<PromoCodeResponse | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [clientError, setClientError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PromoCodeResponse | null>(null);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setClientError(null);
    setModalOpen(true);
  }

  function openEdit(promo: PromoCodeResponse) {
    setEditing(promo);
    setForm({
      code: promo.code,
      description: promo.description ?? '',
      discountType: promo.discountType,
      discountValue: String(promo.discountValue),
      minOrderAmount: promo.minOrderAmount === null ? '' : String(promo.minOrderAmount),
      validFrom: toInputValue(promo.validFrom),
      validUntil: toInputValue(promo.validUntil),
      active: promo.active,
      publicVisible: promo.publicVisible,
      categoryIds: promo.categoryIds.map(String),
      brandIds: promo.brandIds.map(String),
      productIds: promo.productIds.map(String),
    });
    setClientError(null);
    setModalOpen(true);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();

    // Обе проверки на бэкенде живут только в CHECK-ограничениях БД, и нарушение
    // прилетело бы невнятным 409 про целостность данных — ловим до запроса.
    const discountValue = Number(form.discountValue);
    if (form.discountType === 'PERCENT' && discountValue > 100) {
      setClientError('Процентная скидка не может быть больше 100%.');
      return;
    }
    if (form.validFrom && form.validUntil && form.validFrom >= form.validUntil) {
      setClientError('Начало действия должно быть раньше окончания.');
      return;
    }
    setClientError(null);

    const body: PromoCodeRequest = {
      code: form.code.trim(),
      description: form.description || null,
      discountType: form.discountType,
      discountValue,
      minOrderAmount: form.minOrderAmount ? Number(form.minOrderAmount) : null,
      // Строка из datetime-local уходит как есть: на бэкенде это LocalDateTime.
      validFrom: form.validFrom || null,
      validUntil: form.validUntil || null,
      active: form.active,
      publicVisible: form.publicVisible,
      categoryIds: form.categoryIds.map(Number),
      brandIds: form.brandIds.map(Number),
      productIds: form.productIds.map(Number),
    };

    const action = editing
      ? updateMutation.mutateAsync({ id: editing.id, body })
      : createMutation.mutateAsync(body);
    action.then(() => setModalOpen(false)).catch(() => {});
  }

  const activeMutation = editing ? updateMutation : createMutation;
  const bannerError = clientError ?? formError(activeMutation.error);

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <h1>Промокоды</h1>
        <Button size="sm" onClick={openCreate}>
          <PlusIcon width={16} height={16} />
          Добавить промокод
        </Button>
      </div>

      {isError && <ErrorState description="Не удалось загрузить промокоды." onRetry={refetch} />}

      {!isError && (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <colgroup>
              <col className="promo-codes__col--code" />
              <col className="promo-codes__col--description" />
              <col className="promo-codes__col--discount" />
              <col className="promo-codes__col--min-amount" />
              <col className="promo-codes__col--period" />
              <col className="promo-codes__col--scope" />
              <col className="promo-codes__col--status" />
              <col className="promo-codes__col--public" />
              <col className="promo-codes__col--actions" />
            </colgroup>
            <thead>
              <tr>
                <th>Код</th>
                <th>Описание</th>
                <th>Скидка</th>
                <th>Мин. сумма</th>
                <th>Период</th>
                <th>Область</th>
                <th>Статус</th>
                <th>Витрина</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {items?.map((promo) => (
                <tr key={promo.id}>
                  <td className="mono-num">{promo.code}</td>
                  <td className="promo-codes__description">{promo.description ?? '—'}</td>
                  <td>
                    {promo.discountType === 'PERCENT' ? (
                      <span className="mono-num">{promo.discountValue}%</span>
                    ) : (
                      <Price value={promo.discountValue} size="sm" />
                    )}
                  </td>
                  <td>
                    {promo.minOrderAmount === null ? '—' : <Price value={promo.minOrderAmount} size="sm" />}
                  </td>
                  <td className="mono-num">{formatPeriod(promo)}</td>
                  <td>{formatScope(promo)}</td>
                  <td>
                    <span
                      className={`admin-status-dot ${promo.active ? 'admin-status-dot--active' : 'admin-status-dot--inactive'}`}
                    >
                      {promo.active ? 'Активен' : 'Выключен'}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`admin-status-dot ${promo.publicVisible ? 'admin-status-dot--active' : 'admin-status-dot--inactive'}`}
                    >
                      {promo.publicVisible ? 'В слайдере' : 'Скрыт'}
                    </span>
                  </td>
                  <td>
                    <div className="admin-table__actions">
                      <button
                        type="button"
                        className="admin-table__icon-btn"
                        onClick={() => openEdit(promo)}
                        aria-label="Редактировать"
                      >
                        <EditIcon width={16} height={16} />
                      </button>
                      <button
                        type="button"
                        className="admin-table__icon-btn admin-table__icon-btn--danger"
                        onClick={() => setDeleteTarget(promo)}
                        aria-label="Удалить"
                      >
                        <TrashIcon width={16} height={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!isLoading && items?.length === 0 && <div className="admin-empty">Промокодов пока нет.</div>}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Редактировать промокод' : 'Новый промокод'}
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setModalOpen(false)}>
              Отмена
            </Button>
            <Button size="sm" onClick={handleSubmit} disabled={activeMutation.isPending}>
              Сохранить
            </Button>
          </>
        }
      >
        <form className="admin-form" onSubmit={handleSubmit}>
          {bannerError && <div className="admin-banner-error">{bannerError}</div>}

          <div className="admin-form-field">
            <label htmlFor="promo-code">Код</label>
            <input
              id="promo-code"
              className="filter-text-input mono-num"
              value={form.code}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
              maxLength={64}
              required
            />
            <span className="promo-codes__hint">Регистр не важен: код сохраняется в верхнем регистре.</span>
            {fieldError(activeMutation.error, 'code') && (
              <span className="admin-form-error">{fieldError(activeMutation.error, 'code')}</span>
            )}
          </div>

          <div className="admin-form-field">
            <label htmlFor="promo-description">Описание</label>
            <textarea
              id="promo-description"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              maxLength={255}
            />
            <span className="promo-codes__hint">
              Продолжение фразы для слайдера: «По промокоду {form.code || 'SUMMER'} …» — например, «скидка на всю
              сантехнику 10%».
            </span>
            {fieldError(activeMutation.error, 'description') && (
              <span className="admin-form-error">{fieldError(activeMutation.error, 'description')}</span>
            )}
          </div>

          <div className="admin-form-row">
            <div className="admin-form-field">
              <label htmlFor="promo-type">Тип скидки</label>
              <Select
                id="promo-type"
                options={[
                  { value: 'PERCENT', label: 'Процент от суммы' },
                  { value: 'FIXED_AMOUNT', label: 'Фиксированная сумма' },
                ]}
                value={form.discountType}
                onChange={(value) => setForm((f) => ({ ...f, discountType: value as DiscountType }))}
                portal
              />
            </div>
            <div className="admin-form-field">
              <label htmlFor="promo-value">
                Размер скидки, {form.discountType === 'PERCENT' ? '%' : <CurrencySymbol />}
              </label>
              <input
                id="promo-value"
                type="number"
                onWheel={blurOnWheel}
                step="0.01"
                min="0.01"
                max={form.discountType === 'PERCENT' ? 100 : undefined}
                className="filter-text-input mono-num"
                value={form.discountValue}
                onChange={(e) => setForm((f) => ({ ...f, discountValue: e.target.value }))}
                required
              />
              {fieldError(activeMutation.error, 'discountValue') && (
                <span className="admin-form-error">{fieldError(activeMutation.error, 'discountValue')}</span>
              )}
            </div>
          </div>

          <div className="admin-form-field">
            <label htmlFor="promo-min-order">
              Минимальная сумма заказа, <CurrencySymbol />
            </label>
            <input
              id="promo-min-order"
              type="number"
              onWheel={blurOnWheel}
              step="0.01"
              min="0"
              className="filter-text-input mono-num"
              value={form.minOrderAmount}
              onChange={(e) => setForm((f) => ({ ...f, minOrderAmount: e.target.value }))}
            />
            <span className="promo-codes__hint">
              Пусто — без ограничения. Сравнивается с суммой всей корзины, а не только подходящих товаров.
            </span>
          </div>

          <div className="admin-form-row">
            <div className="admin-form-field">
              <label htmlFor="promo-valid-from">Действует с</label>
              <input
                id="promo-valid-from"
                type="datetime-local"
                className="filter-text-input mono-num"
                value={form.validFrom}
                onChange={(e) => setForm((f) => ({ ...f, validFrom: e.target.value }))}
              />
            </div>
            <div className="admin-form-field">
              <label htmlFor="promo-valid-until">Действует до</label>
              <input
                id="promo-valid-until"
                type="datetime-local"
                className="filter-text-input mono-num"
                value={form.validUntil}
                onChange={(e) => setForm((f) => ({ ...f, validUntil: e.target.value }))}
              />
            </div>
          </div>

          <fieldset className="promo-codes__scope">
            <legend>Область действия</legend>
            <div className="admin-form-field">
              <label htmlFor="promo-categories">Категории</label>
              <SearchableSelect
                id="promo-categories"
                options={categories?.map((c) => ({ value: String(c.id), label: c.name })) ?? []}
                selected={form.categoryIds}
                onChange={(values) => setForm((f) => ({ ...f, categoryIds: values }))}
                multiple
                placeholder="Не ограничивать"
                searchPlaceholder="Поиск категории…"
                portal
              />
              <span className="promo-codes__hint">Категория действует вместе со своими подкатегориями.</span>
            </div>
            <div className="admin-form-field">
              <label htmlFor="promo-brands">Бренды</label>
              <SearchableSelect
                id="promo-brands"
                options={brands?.map((b) => ({ value: String(b.id), label: b.name })) ?? []}
                selected={form.brandIds}
                onChange={(values) => setForm((f) => ({ ...f, brandIds: values }))}
                multiple
                placeholder="Не ограничивать"
                searchPlaceholder="Поиск бренда…"
                portal
              />
            </div>
            <div className="admin-form-field">
              <label htmlFor="promo-products">Товары</label>
              <SearchableSelect
                id="promo-products"
                options={products?.map((p) => ({ value: String(p.groupId), label: p.name })) ?? []}
                selected={form.productIds}
                onChange={(values) => setForm((f) => ({ ...f, productIds: values }))}
                multiple
                placeholder="Не ограничивать"
                searchPlaceholder="Поиск товара…"
                portal
              />
              {productsTruncated && (
                <span className="admin-form-error">
                  Показаны первые {PRODUCTS_PAGE_SIZE} товаров из {productsPage?.totalElements}.
                </span>
              )}
            </div>
            <span className="promo-codes__hint">
              Ничего не выбрано — промокод действует на весь заказ. Иначе скидка считается по позициям, которые
              попали хотя бы в один из трёх списков.
            </span>
          </fieldset>

          <label className="admin-form-checkbox">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
            />
            Активен (принимается при оформлении заказа)
          </label>
          <label className="admin-form-checkbox">
            <input
              type="checkbox"
              checked={form.publicVisible}
              onChange={(e) => setForm((f) => ({ ...f, publicVisible: e.target.checked }))}
            />
            Показывать в слайдере на витрине
          </label>
        </form>
      </Modal>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Удалить промокод?"
        description={`Промокод «${deleteTarget?.code}» перестанет работать. Уже оформленные заказы сохранят его в истории.`}
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
