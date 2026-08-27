'use client';

import { Fragment, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import '@/admin/admin.css';
import '@/components/filters/Filters.css';
import './ProductsPage.css';
import {
  listProductGroups,
  createVariant,
  createVariantSibling,
  updateVariant,
  deleteVariant,
  updateProductGroup,
  replaceProductGroupAxes,
  listCategories,
  listBrands,
  listCategoryAttributes,
  listAttributeOptions,
} from '@/api/admin';
import type {
  AttributeOptionResponse,
  AttributeValue,
  BrandResponse,
  ExternalProductResponse,
  CategoryAttributeResponse,
  CategoryResponse,
  ProductGroupAxisRequest,
  ProductGroupRequest,
  ProductGroupRowResponse,
  ProductVariantResponse,
  ProductVariantSiblingRequest,
  ProductVariantUpdateRequest,
} from '@/api/types';
import { Modal } from '@/admin/components/Modal';
import { ConfirmDialog } from '@/admin/components/ConfirmDialog';
import { SlugField } from '@/admin/components/SlugField';
import { ExternalSourceField } from '@/admin/components/ExternalSourceField';
import { RequiredMark } from '@/admin/components/RequiredMark';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { Pagination } from '@/components/ui/Pagination';
import { Select } from '@/components/ui/Select';
import { CurrencySymbol } from '@/components/ui/CurrencySymbol';
import { fieldError, formError } from '@/admin/formErrors';
import { groupTitle } from '@/admin/productGroupTitle';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { PlusIcon, EditIcon, TrashIcon } from '@/components/ui/icons';
import { formatPrice } from '@/utils/price';
import { blurOnWheel } from '@/utils/numberInput';

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 300;

/** Остаток при заполнении из источника: их наличие к нашему складу отношения не имеет. */
const IMPORTED_STOCK_QUANTITY = '5';

interface FormState {
  name: string;
  slug: string;
  sku: string;
  price: string;
  oldPrice: string;
  stockQuantity: string;
  weightKg: string;
  active: boolean;
  /** Поле модели, а не позиции, но им определяется набор характеристик формы — нужно во всех режимах. */
  categoryId: string;
  attributes: Record<string, string>;
}

const EMPTY_FORM: FormState = {
  name: '', slug: '', sku: '', price: '', oldPrice: '', stockQuantity: '0', weightKg: '',
  active: true, categoryId: '', attributes: {},
};

/**
 * Остальные поля модели задаются только при её создании — дальше их правит форма модели.
 * Отдельным состоянием, чтобы они не могли утечь в запрос правки позиции.
 */
const EMPTY_NEW_GROUP = { brandId: '', description: '' };

/** Незаполненное поле и отсутствующий ключ — одно и то же, иначе форма «грязная» сразу после открытия. */
function sameAttributes(a: Record<string, string>, b: Record<string, string>): boolean {
  const slugs = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const slug of slugs) {
    if ((a[slug] ?? '') !== (b[slug] ?? '')) return false;
  }
  return true;
}

function sameForm(a: FormState, b: FormState): boolean {
  return (
    a.name === b.name &&
    a.slug === b.slug &&
    a.sku === b.sku &&
    a.price === b.price &&
    a.oldPrice === b.oldPrice &&
    a.stockQuantity === b.stockQuantity &&
    a.weightKg === b.weightKg &&
    a.active === b.active &&
    a.categoryId === b.categoryId &&
    sameAttributes(a.attributes, b.attributes)
  );
}

/**
 * Режим формы позиции: новая позиция, правка, либо новое исполнение существующей.
 * В двух последних несёт строку модели — из неё берутся оси.
 */
type FormMode =
  | { kind: 'create' }
  | { kind: 'edit'; group: ProductGroupRowResponse; variant: ProductVariantResponse }
  | { kind: 'sibling'; group: ProductGroupRowResponse; source: ProductVariantResponse };

export function ProductsPage() {
  const queryClient = useQueryClient();
  const { data: categories } = useQuery({ queryKey: ['admin-categories'], queryFn: () => listCategories() });
  const { data: brands } = useQuery({ queryKey: ['admin-brands'], queryFn: listBrands });

  const router = useRouter();
  const pathname = usePathname() ?? '';
  const query = (useSearchParams() ?? new URLSearchParams()).toString();

  // Фильтры живут в URL, чтобы переживать refresh и возврат со страницы фото.
  const searchParams = new URLSearchParams(query);
  const categoryFilter = searchParams.get('categoryId') ?? '';
  const search = searchParams.get('search') ?? '';
  const page = Math.max(0, Number(searchParams.get('page') ?? '1') - 1) || 0;

  const [searchInput, setSearchInput] = useState(search);
  const debouncedSearch = useDebouncedValue(searchInput, SEARCH_DEBOUNCE_MS);

  function commit(next: URLSearchParams) {
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  function updateParams(patch: Record<string, string>) {
    const next = new URLSearchParams(query);
    for (const [key, value] of Object.entries(patch)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    next.delete('page');
    commit(next);
  }

  function setPage(nextPage: number) {
    const next = new URLSearchParams(query);
    if (nextPage <= 0) next.delete('page');
    else next.set('page', String(nextPage + 1));
    commit(next);
  }

  useEffect(() => {
    const next = debouncedSearch.trim();
    const params = new URLSearchParams(query);
    if (next === (params.get('search') ?? '')) return;
    if (next) params.set('search', next);
    else params.delete('search');
    params.delete('page');
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [debouncedSearch, query, pathname, router]);

  const hasFilter = Boolean(categoryFilter || search);

  const {
    data: pageData,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['admin-product-groups', { categoryId: categoryFilter, search, page }],
    queryFn: () =>
      listProductGroups({
        categoryId: categoryFilter ? Number(categoryFilter) : undefined,
        search: search || undefined,
        page,
        size: PAGE_SIZE,
      }),
    enabled: hasFilter,
  });

  const [mode, setMode] = useState<FormMode>({ kind: 'create' });
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [newGroup, setNewGroup] = useState(EMPTY_NEW_GROUP);
  const [deleteTarget, setDeleteTarget] = useState<ProductVariantResponse | null>(null);
  const [closeConfirmOpen, setCloseConfirmOpen] = useState(false);
  // Снимок на момент открытия: по нему решаем, есть ли что терять при закрытии.
  const [initialForm, setInitialForm] = useState<FormState>(EMPTY_FORM);
  const [initialNewGroup, setInitialNewGroup] = useState(EMPTY_NEW_GROUP);
  const [groupTarget, setGroupTarget] = useState<ProductGroupRowResponse | null>(null);

  // Набор атрибутов определяется категорией формы, а не фильтром списка.
  const formCategoryId = form.categoryId ? Number(form.categoryId) : undefined;

  const { data: bindings } = useQuery({
    queryKey: ['admin-category-attributes', formCategoryId],
    queryFn: () => listCategoryAttributes(formCategoryId!),
    enabled: formCategoryId !== undefined,
  });

  const optionAttributeIds = bindings?.filter((b) => b.attributeType === 'OPTION').map((b) => b.attributeId) ?? [];

  const { data: optionsByAttributeId } = useQuery({
    queryKey: ['admin-attribute-options-bulk', optionAttributeIds],
    queryFn: async () => {
      const entries = await Promise.all(
        optionAttributeIds.map(async (id) => [id, await listAttributeOptions(id)] as const),
      );
      return Object.fromEntries(entries) as Record<number, AttributeOptionResponse[]>;
    },
    enabled: optionAttributeIds.length > 0,
  });

  // Оси берутся из строки списка — догружать их отдельным запросом не нужно.
  const axisSlugs = (mode.kind === 'create' ? [] : mode.group.axes).map((axis) => axis.attributeSlug);

  function invalidate() {
    return queryClient.invalidateQueries({ queryKey: ['admin-product-groups'] });
  }

  const createMutation = useMutation({ mutationFn: createVariant, onSuccess: invalidate });
  const siblingMutation = useMutation({
    mutationFn: (vars: { sourceId: number; body: ProductVariantSiblingRequest }) =>
      createVariantSibling(vars.sourceId, vars.body),
    onSuccess: invalidate,
  });
  const updateMutation = useMutation({
    mutationFn: (vars: { id: number; body: ProductVariantUpdateRequest }) => updateVariant(vars.id, vars.body),
    onSuccess: invalidate,
  });
  const deleteMutation = useMutation({ mutationFn: deleteVariant, onSuccess: invalidate });

  function attributesToForm(source: Record<string, AttributeValue>): Record<string, string> {
    const result: Record<string, string> = {};
    for (const [key, value] of Object.entries(source)) {
      result[key] = value === null || value === undefined ? '' : String(value);
    }
    return result;
  }

  function openForm(nextForm: FormState, nextGroup = EMPTY_NEW_GROUP) {
    setForm(nextForm);
    setNewGroup(nextGroup);
    setInitialForm(nextForm);
    setInitialNewGroup(nextGroup);
    setModalOpen(true);
  }

  function openCreate() {
    setMode({ kind: 'create' });
    openForm({ ...EMPTY_FORM, categoryId: categoryFilter });
  }

  function openEdit(group: ProductGroupRowResponse, variant: ProductVariantResponse) {
    setMode({ kind: 'edit', group, variant });
    openForm({
      name: variant.name,
      slug: variant.slug,
      sku: variant.sku,
      price: variant.price.toString(),
      oldPrice: variant.oldPrice?.toString() ?? '',
      stockQuantity: variant.stockQuantity.toString(),
      weightKg: variant.weightKg?.toString() ?? '',
      active: variant.active,
      categoryId: variant.categoryId.toString(),
      attributes: attributesToForm(variant.attributes),
    });
  }

  /**
   * Новое исполнение модели. Характеристики и цена копируются с первого исполнения (оно базовое),
   * а имя, артикул и slug остаются пустыми: имя соседа описывает именно его исполнение
   * («…, хром») и легко уехало бы в новую позицию незамеченным.
   */
  function openSibling(group: ProductGroupRowResponse) {
    const source = group.variants[0];
    if (!source) return;
    setMode({ kind: 'sibling', group, source });
    openForm({
      name: '',
      slug: '',
      sku: '',
      price: source.price.toString(),
      oldPrice: source.oldPrice?.toString() ?? '',
      stockQuantity: '0',
      weightKg: source.weightKg?.toString() ?? '',
      active: source.active,
      categoryId: source.categoryId.toString(),
      attributes: attributesToForm(source.attributes),
    });
  }

  /**
   * Артикул и slug намеренно не трогаем: их задаёт администратор, slug — штатной кнопкой
   * генерации. Наличие источника тоже игнорируем, остаток ставим свой.
   */
  function applyExternal(data: ExternalProductResponse) {
    setForm((f) => ({
      ...f,
      name: data.name,
      price: data.price.toString(),
      stockQuantity: IMPORTED_STOCK_QUANTITY,
      attributes: { ...f.attributes, ...attributesToForm(data.attributes) },
    }));
    if (mode.kind === 'create') {
      setNewGroup((g) => ({
        brandId: data.brandId !== null ? data.brandId.toString() : g.brandId,
        description: data.description,
      }));
    }
  }

  /**
   * Форма заполняется долго, а клик мимо модалки или Esc закрывали её молча.
   * Закрытие спрашивают всегда — кроме успешного сохранения, оно закрывает напрямую.
   */
  function requestClose() {
    // Esc долетает и до формы, и до подтверждения: без guard'а второе открывалось бы заново.
    if (closeConfirmOpen) return;
    const changed =
      !sameForm(form, initialForm) ||
      newGroup.brandId !== initialNewGroup.brandId ||
      newGroup.description !== initialNewGroup.description;
    if (!changed) {
      setModalOpen(false);
      return;
    }
    setCloseConfirmOpen(true);
  }

  function discardAndClose() {
    setCloseConfirmOpen(false);
    setModalOpen(false);
  }

  function collectAttributes(): Record<string, AttributeValue> {
    const attributes: Record<string, AttributeValue> = {};
    for (const binding of bindings ?? []) {
      const raw = form.attributes[binding.attributeSlug];
      if (raw === '' || raw === undefined) continue;
      if (binding.attributeType === 'NUMBER') attributes[binding.attributeSlug] = Number(raw);
      else if (binding.attributeType === 'BOOLEAN') attributes[binding.attributeSlug] = raw === 'true';
      else attributes[binding.attributeSlug] = raw;
    }
    return attributes;
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const common = {
      name: form.name,
      slug: form.slug,
      sku: form.sku,
      price: Number(form.price),
      oldPrice: form.oldPrice ? Number(form.oldPrice) : null,
      stockQuantity: Number(form.stockQuantity) || 0,
      weightKg: form.weightKg ? Number(form.weightKg) : null,
      active: form.active,
      attributes: collectAttributes(),
    };

    const saved =
      mode.kind === 'sibling'
        ? siblingMutation.mutateAsync({ sourceId: mode.source.id, body: common })
        : mode.kind === 'edit'
          ? updateMutation.mutateAsync({ id: mode.variant.id, body: common })
          : createMutation.mutateAsync({
              ...common,
              categoryId: Number(form.categoryId),
              brandId: newGroup.brandId ? Number(newGroup.brandId) : null,
              description: newGroup.description || null,
            });

    saved.then(() => setModalOpen(false)).catch(() => {});
  }

  const activeMutation =
    mode.kind === 'sibling' ? siblingMutation : mode.kind === 'edit' ? updateMutation : createMutation;

  const modalTitle =
    mode.kind === 'sibling' ? 'Новое исполнение' : mode.kind === 'edit' ? 'Редактировать товар' : 'Новый товар';

  const brandNames = new Map(brands?.map((brand) => [brand.id, brand.name]));

  return (
    <div className="admin-page admin-page--wide">
      <div className="admin-page__header">
        <h1>Товары</h1>
        <Button size="sm" onClick={openCreate} disabled={!categories || categories.length === 0}>
          <PlusIcon width={16} height={16} />
          Добавить товар
        </Button>
      </div>

      <div className="products-page__filters">
        <div className="admin-form-field">
          <label htmlFor="product-category-filter">Категория</label>
          <Select
            id="product-category-filter"
            options={[{ value: '', label: 'Все категории' }, ...(categories?.map((c) => ({ value: String(c.id), label: c.name })) ?? [])]}
            value={categoryFilter}
            onChange={(value) => updateParams({ categoryId: value })}
          />
        </div>
        <div className="admin-form-field">
          <label htmlFor="product-search">Поиск</label>
          <input
            id="product-search"
            className="filter-text-input"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Название или артикул"
            autoComplete="off"
          />
        </div>
      </div>

      {!hasFilter && (
        <div className="admin-empty">Выберите категорию или введите запрос, чтобы увидеть товары.</div>
      )}

      {hasFilter && isError && <ErrorState description="Не удалось загрузить товары." onRetry={refetch} />}

      {hasFilter && !isError && (
        <div className="admin-table-wrap">
          <table className="admin-table products-page__table">
            <colgroup>
              <col className="products-page__col--id" />
              <col className="products-page__col--name" />
              <col className="products-page__col--sku" />
              <col className="products-page__col--price" />
              <col className="products-page__col--stock" />
              <col className="products-page__col--status" />
              <col className="products-page__col--brand" />
              <col className="products-page__col--actions" />
            </colgroup>
            <thead>
              <tr>
                <th>ID</th>
                <th>Название</th>
                <th>Артикул</th>
                <th>Цена</th>
                <th>Остаток</th>
                <th>Статус</th>
                <th>Бренд</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {pageData?.content.map((group) => (
                <Fragment key={group.id}>
                  <tr className="products-page__group-row">
                    <td colSpan={8}>
                      <div className="products-page__group-head">
                        <span className="products-page__group-title">{groupTitle(group.variants)}</span>
                        <span className="products-page__group-meta">{shownCount(group)}</span>
                        {group.axes.length > 0 && (
                          <span className="products-page__group-meta">
                            различает: {group.axes.map((axis) => axis.attributeName).join(', ')}
                          </span>
                        )}
                        {group.axes.length === 0 && group.variantTotal > 1 && (
                          <span className="admin-form-error">оси не заданы</span>
                        )}
                        <div className="admin-table__actions products-page__group-actions">
                          <button
                            type="button"
                            className="admin-table__link-btn"
                            onClick={() => openSibling(group)}
                          >
                            Добавить
                          </button>
                          <Link
                            href={`/admin/products/groups/${group.id}/images`}
                            className="admin-table__link-btn"
                          >
                            Фото
                          </Link>
                          <button
                            type="button"
                            className="admin-table__link-btn"
                            onClick={() => setGroupTarget(group)}
                          >
                            Редактировать
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                  {group.variants.map((variant) => (
                    <tr key={variant.id}>
                      <td className="mono-num">{variant.id}</td>
                      <td>{variant.name}</td>
                      <td className="mono-num">{variant.sku}</td>
                      <td className="mono-num">{formatPrice(variant.price)}</td>
                      <td className="mono-num">{variant.stockQuantity}</td>
                      <td>
                        <span className={`admin-status-dot ${variant.active ? 'admin-status-dot--active' : 'admin-status-dot--inactive'}`}>
                          {variant.active ? 'Активен' : 'Скрыт'}
                        </span>
                      </td>
                      <td>{(variant.brandId !== null && brandNames.get(variant.brandId)) || '—'}</td>
                      <td>
                        <div className="admin-table__actions">
                          <Link href={`/admin/products/${variant.id}/images`} className="admin-table__link-btn">
                            Фото
                          </Link>
                          <button
                            type="button"
                            className="admin-table__icon-btn"
                            onClick={() => openEdit(group, variant)}
                            aria-label="Редактировать"
                          >
                            <EditIcon width={16} height={16} />
                          </button>
                          <button
                            type="button"
                            className="admin-table__icon-btn admin-table__icon-btn--danger"
                            onClick={() => setDeleteTarget(variant)}
                            aria-label="Удалить"
                          >
                            <TrashIcon width={16} height={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
          {!isLoading && pageData?.content.length === 0 && (
            <div className="admin-empty">{search ? 'Ничего не найдено.' : 'Товаров пока нет.'}</div>
          )}
        </div>
      )}

      {hasFilter && pageData && <Pagination page={page} totalPages={pageData.totalPages} onChange={setPage} />}

      <Modal
        open={modalOpen}
        onClose={requestClose}
        title={modalTitle}
        size="wide"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={requestClose}>
              Отмена
            </Button>
            <Button size="sm" onClick={handleSubmit} disabled={activeMutation.isPending || !form.categoryId}>
              Сохранить
            </Button>
          </>
        }
      >
        <form className="admin-form products-page__form" onSubmit={handleSubmit}>
          <div className="products-page__form-col">
            {formError(activeMutation.error) && (
              <div className="admin-banner-error">{formError(activeMutation.error)}</div>
            )}

            {mode.kind !== 'edit' && (
              <ExternalSourceField categoryId={form.categoryId} onFilled={applyExternal} />
            )}

            {mode.kind === 'sibling' && (
              <div className="admin-form-note">
                Новое исполнение той же модели. Характеристики, цена и вес скопированы с первого
                исполнения — поправьте различающую характеристику и заполните название, артикул и slug.
              </div>
            )}

            {mode.kind === 'edit' && (
              <div className="admin-form-note">
                Категория, бренд, описание и то, какая характеристика различает исполнения, —
                свойства модели целиком: правятся кнопкой «Редактировать» в её строке.
              </div>
            )}

            <div className="admin-form-field">
              <label htmlFor="product-name">Название<RequiredMark /></label>
              <input
                id="product-name"
                className="filter-text-input"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
              {fieldError(activeMutation.error, 'name') && (
                <span className="admin-form-error">{fieldError(activeMutation.error, 'name')}</span>
              )}
            </div>

            <SlugField
              id="product-slug"
              value={form.slug}
              source={form.name}
              onChange={(slug) => setForm((f) => ({ ...f, slug }))}
              required
              error={fieldError(activeMutation.error, 'slug')}
            />

            <div className="admin-form-row">
              <div className="admin-form-field">
                <label htmlFor="product-sku">Артикул<RequiredMark /></label>
                <input
                  id="product-sku"
                  className="filter-text-input mono-num"
                  value={form.sku}
                  onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
                  required
                />
                {fieldError(activeMutation.error, 'sku') && (
                  <span className="admin-form-error">{fieldError(activeMutation.error, 'sku')}</span>
                )}
              </div>
              <div className="admin-form-field">
                <label htmlFor="product-price">
                  Цена, <CurrencySymbol />
                  <RequiredMark />
                </label>
                <input
                  id="product-price"
                  type="number"
                  onWheel={blurOnWheel}
                  step="0.01"
                  className="filter-text-input mono-num"
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                  required
                />
                {fieldError(activeMutation.error, 'price') && (
                  <span className="admin-form-error">{fieldError(activeMutation.error, 'price')}</span>
                )}
              </div>
              <div className="admin-form-field">
                <label htmlFor="product-old-price">
                  Была, <CurrencySymbol />
                </label>
                <input
                  id="product-old-price"
                  type="number"
                  onWheel={blurOnWheel}
                  step="0.01"
                  className="filter-text-input mono-num"
                  value={form.oldPrice}
                  onChange={(e) => setForm((f) => ({ ...f, oldPrice: e.target.value }))}
                  placeholder="без скидки"
                />
                {fieldError(activeMutation.error, 'oldPrice') && (
                  <span className="admin-form-error">{fieldError(activeMutation.error, 'oldPrice')}</span>
                )}
              </div>
            </div>

            <div className="admin-form-row">
              <div className="admin-form-field">
                <label htmlFor="product-stock">Остаток, шт.</label>
                <input
                  id="product-stock"
                  type="number"
                  onWheel={blurOnWheel}
                  className="filter-text-input mono-num"
                  value={form.stockQuantity}
                  onChange={(e) => setForm((f) => ({ ...f, stockQuantity: e.target.value }))}
                />
              </div>
              <div className="admin-form-field">
                <label htmlFor="product-weight">Вес, кг</label>
                <input
                  id="product-weight"
                  type="number"
                  onWheel={blurOnWheel}
                  step="0.001"
                  className="filter-text-input mono-num"
                  value={form.weightKg}
                  onChange={(e) => setForm((f) => ({ ...f, weightKg: e.target.value }))}
                />
              </div>
            </div>

            <label className="admin-form-checkbox">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
              />
              Активен (виден в каталоге)
            </label>

            {mode.kind === 'create' && (
              <fieldset className="products-page__shared">
                <legend>Общие характеристики</legend>

                <div className="admin-form-row">
                  <div className="admin-form-field">
                    <label htmlFor="product-category">Категория<RequiredMark /></label>
                    <Select
                      id="product-category"
                      options={categories?.map((c) => ({ value: String(c.id), label: c.name })) ?? []}
                      value={form.categoryId}
                      onChange={(value) => setForm((f) => ({ ...f, categoryId: value, attributes: {} }))}
                      placeholder="Выберите категорию"
                      portal
                      searchable
                      searchPlaceholder="Поиск категории"
                    />
                  </div>
                  <div className="admin-form-field">
                    <label htmlFor="product-brand">Бренд</label>
                    <Select
                      id="product-brand"
                      options={[{ value: '', label: 'Без бренда' }, ...(brands?.map((b) => ({ value: String(b.id), label: b.name })) ?? [])]}
                      value={newGroup.brandId}
                      onChange={(value) => setNewGroup((g) => ({ ...g, brandId: value }))}
                      portal
                      searchable
                      searchPlaceholder="Поиск бренда"
                    />
                  </div>
                </div>

                <div className="admin-form-field">
                  <label htmlFor="product-description">Описание</label>
                  <textarea
                    id="product-description"
                    rows={10}
                    value={newGroup.description}
                    onChange={(e) => setNewGroup((g) => ({ ...g, description: e.target.value }))}
                  />
                </div>
              </fieldset>
            )}
          </div>

          <div className="products-page__form-col">
            <div className="admin-form-field">
              <label>Характеристики категории</label>
            </div>
            {bindings && bindings.length > 0 ? (
              bindings.map((binding) => (
                <AttributeField
                  key={binding.attributeSlug}
                  binding={binding}
                  value={form.attributes[binding.attributeSlug] ?? ''}
                  options={optionsByAttributeId?.[binding.attributeId]}
                  onChange={(value) =>
                    setForm((f) => ({ ...f, attributes: { ...f.attributes, [binding.attributeSlug]: value } }))
                  }
                  error={fieldError(activeMutation.error, binding.attributeSlug)}
                  isAxis={axisSlugs.includes(binding.attributeSlug)}
                />
              ))
            ) : (
              <span className="products-page__form-hint">
                {form.categoryId
                  ? 'У категории нет характеристик.'
                  : 'Выберите категорию — её характеристики появятся здесь.'}
              </span>
            )}
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={closeConfirmOpen}
        title="Закрыть без сохранения?"
        description="Заполненные поля будут потеряны."
        confirmLabel="Закрыть"
        onCancel={() => setCloseConfirmOpen(false)}
        onConfirm={discardAndClose}
      />

      {groupTarget && (
        <ProductGroupModal
          group={groupTarget}
          categories={categories}
          brands={brands}
          onClose={() => setGroupTarget(null)}
          onSaved={() => {
            setGroupTarget(null);
            invalidate();
          }}
        />
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Удалить товар?"
        description={`Товар «${deleteTarget?.name}» будет удалён безвозвратно.`}
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

/** Под поиском показана часть модели, и счётчик обязан говорить, какая именно. */
function shownCount(group: ProductGroupRowResponse): string {
  return group.variants.length < group.variantTotal
    ? `${group.variants.length} из ${variantCount(group.variantTotal)}`
    : variantCount(group.variantTotal);
}

function variantCount(count: number): string {
  const tail = count % 100 >= 11 && count % 100 <= 14 ? 0 : count % 10;
  if (tail === 1) return `${count} исполнение`;
  if (tail >= 2 && tail <= 4) return `${count} исполнения`;
  return `${count} исполнений`;
}

interface ProductGroupModalProps {
  group: ProductGroupRowResponse;
  categories: CategoryResponse[] | undefined;
  brands: BrandResponse[] | undefined;
  onClose: () => void;
  onSaved: () => void;
}

/**
 * Форма модели: всё, что общее для её исполнений. Стартовое состояние берётся из строки
 * списка — она уже несёт и оси, и позиции, поэтому догружать нечего и гонки нет.
 */
function ProductGroupModal({ group, categories, brands, onClose, onSaved }: ProductGroupModalProps) {
  const savedBrandId = group.brandId?.toString() ?? '';
  const savedDescription = group.description ?? '';
  const savedAxisSlugs = group.axes.map((axis) => axis.attributeSlug);

  const [brandId, setBrandId] = useState(savedBrandId);
  const [description, setDescription] = useState(savedDescription);
  const [axisSlugs, setAxisSlugs] = useState<string[]>(savedAxisSlugs);
  const [closeConfirmOpen, setCloseConfirmOpen] = useState(false);

  const { data: bindings } = useQuery({
    queryKey: ['admin-category-attributes', group.categoryId],
    queryFn: () => listCategoryAttributes(group.categoryId),
  });

  const groupMutation = useMutation({
    mutationFn: (body: ProductGroupRequest) => updateProductGroup(group.id, body),
  });
  const axesMutation = useMutation({
    mutationFn: (body: ProductGroupAxisRequest[]) => replaceProductGroupAxes(group.id, body),
  });

  const fieldsChanged = brandId !== savedBrandId || description !== savedDescription;
  const axesChanged =
    axisSlugs.length !== savedAxisSlugs.length ||
    axisSlugs.some((slug) => !savedAxisSlugs.includes(slug));

  function handleSubmit(e: FormEvent) {
    e.preventDefault();

    // Порядок осей — порядок атрибутов категории; он же задаёт порядок групп
    // в переключателе исполнений на витрине.
    const axesBody: ProductGroupAxisRequest[] = (bindings ?? [])
      .filter((binding) => axisSlugs.includes(binding.attributeSlug))
      .map((binding, index) => ({ attributeId: binding.attributeId, sortOrder: index }));

    const saves: Promise<unknown>[] = [];
    if (fieldsChanged) {
      saves.push(groupMutation.mutateAsync({
        brandId: brandId ? Number(brandId) : null,
        description: description || null,
      }));
    }
    if (axesChanged) {
      saves.push(axesMutation.mutateAsync(axesBody));
    }

    Promise.all(saves).then(onSaved).catch(() => {});
  }

  const isPending = groupMutation.isPending || axesMutation.isPending;
  const error = formError(groupMutation.error ?? axesMutation.error);

  function requestClose() {
    if (closeConfirmOpen) return;
    if (!fieldsChanged && !axesChanged) {
      onClose();
      return;
    }
    setCloseConfirmOpen(true);
  }

  return (
    <>
      <Modal
        open
        onClose={requestClose}
        title={groupTitle(group.variants)}
        size="wide"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={requestClose}>
              Отмена
            </Button>
            <Button size="sm" onClick={handleSubmit} disabled={isPending}>
              Сохранить
            </Button>
          </>
        }
      >
        <form className="admin-form products-page__form" onSubmit={handleSubmit}>
          <div className="products-page__form-col">
            {error && <div className="admin-banner-error">{error}</div>}

            <div className="admin-form-note">
              Эти поля общие для всех исполнений модели — {variantCount(group.variantTotal)}.
            </div>

            <div className="admin-form-row">
              <div className="admin-form-field">
                <label htmlFor="group-category">Категория</label>
                <input
                  id="group-category"
                  className="filter-text-input"
                  value={categories?.find((c) => c.id === group.categoryId)?.name ?? ''}
                  readOnly
                />
                <span className="admin-form-hint">Категорию нельзя изменить после создания</span>
              </div>
              <div className="admin-form-field">
                <label htmlFor="group-brand">Бренд</label>
                <Select
                  id="group-brand"
                  options={[{ value: '', label: 'Без бренда' }, ...(brands?.map((b) => ({ value: String(b.id), label: b.name })) ?? [])]}
                  value={brandId}
                  onChange={setBrandId}
                  portal
                  searchable
                  searchPlaceholder="Поиск бренда"
                />
              </div>
            </div>

            <div className="admin-form-field">
              <label htmlFor="group-description">Описание</label>
              <textarea
                id="group-description"
                rows={10}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          <div className="products-page__form-col">
            <div className="admin-form-field">
              <label>Что различает исполнения</label>
            </div>
            {bindings && bindings.length > 0 ? (
              bindings.map((binding) => (
                <label key={binding.attributeSlug} className="admin-form-checkbox">
                  <input
                    type="checkbox"
                    checked={axisSlugs.includes(binding.attributeSlug)}
                    onChange={(e) =>
                      setAxisSlugs((slugs) =>
                        e.target.checked
                          ? [...slugs, binding.attributeSlug]
                          : slugs.filter((slug) => slug !== binding.attributeSlug),
                      )
                    }
                  />
                  {binding.attributeName}
                </label>
              ))
            ) : (
              <span className="products-page__form-hint">У категории нет характеристик.</span>
            )}
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={closeConfirmOpen}
        title="Закрыть без сохранения?"
        description="Изменения модели будут потеряны."
        confirmLabel="Закрыть"
        onCancel={() => setCloseConfirmOpen(false)}
        onConfirm={onClose}
      />
    </>
  );
}

interface AttributeFieldProps {
  binding: CategoryAttributeResponse;
  value: string;
  options: AttributeOptionResponse[] | undefined;
  onChange: (value: string) => void;
  error?: string;
  isAxis: boolean;
}

function AttributeField({ binding, value, options, onChange, error, isAxis }: AttributeFieldProps) {
  // Единица измерения у числовых лежит отдельной колонкой — в подписи её иначе не видно.
  const unit = binding.attributeType === 'NUMBER' && binding.attributeUnit ? ` (${binding.attributeUnit})` : '';

  const label = (
    <>
      {binding.attributeName}
      {unit}
      {binding.required && <RequiredMark />}
    </>
  );

  // Пометка, а не переключатель: набор осей — свойство модели и правится в её форме.
  const axisNote = isAxis && <span className="products-page__axis">Различает исполнения</span>;

  // BOOLEAN селектом, а не чекбоксом: чекбокс не отличает «не заполнено» от «Нет».
  // «Да»/«Нет» — те же подписи, что показывает витрина (formatAttributeValue).
  if (binding.attributeType === 'BOOLEAN' || binding.attributeType === 'OPTION') {
    const selectOptions =
      binding.attributeType === 'BOOLEAN'
        ? [
            { value: '', label: '— не выбрано —' },
            { value: 'true', label: 'Да' },
            { value: 'false', label: 'Нет' },
          ]
        : [
            { value: '', label: '— не выбрано —' },
            ...(options?.map((option) => ({ value: option.value, label: option.value })) ?? []),
          ];

    return (
      <div className="admin-form-field">
        <label>{label}</label>
        {/* Поиск только у OPTION: у BOOLEAN в списке три пункта, строка ввода там мешает. */}
        <Select
          options={selectOptions}
          value={value}
          onChange={onChange}
          portal
          searchable={binding.attributeType === 'OPTION'}
          searchPlaceholder="Поиск значения"
        />
        {axisNote}
        {error && <span className="admin-form-error">{error}</span>}
      </div>
    );
  }

  return (
    <div className="admin-form-field">
      <label>{label}</label>
      <input
        type={binding.attributeType === 'NUMBER' ? 'number' : 'text'}
        onWheel={binding.attributeType === 'NUMBER' ? blurOnWheel : undefined}
        className="filter-text-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {axisNote}
      {error && <span className="admin-form-error">{error}</span>}
    </div>
  );
}
