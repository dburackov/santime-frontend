'use client';

import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import '@/admin/admin.css';
import '@/components/filters/Filters.css';
import './ProductsPage.css';
import {
  listProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  listCategories,
  listBrands,
} from '@/api/admin';
import type { ProductRequest, ProductResponse } from '@/api/types';
import { Modal } from '@/admin/components/Modal';
import { ConfirmDialog } from '@/admin/components/ConfirmDialog';
import { RequiredMark } from '@/admin/components/RequiredMark';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { Pagination } from '@/components/ui/Pagination';
import { Select } from '@/components/ui/Select';
import { fieldError, formError } from '@/admin/formErrors';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { PlusIcon, EditIcon, TrashIcon } from '@/components/ui/icons';

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 300;

interface FormState {
  name: string;
  slug: string;
  description: string;
  categoryId: string;
  brandId: string;
}

const EMPTY_FORM: FormState = {
  name: '', slug: '', description: '', categoryId: '', brandId: '',
};

export function ProductsPage() {
  const queryClient = useQueryClient();
  const { data: categories } = useQuery({ queryKey: ['admin-categories'], queryFn: () => listCategories() });
  const { data: brands } = useQuery({ queryKey: ['admin-brands'], queryFn: listBrands });

  const router = useRouter();
  const pathname = usePathname() ?? '';
  const query = (useSearchParams() ?? new URLSearchParams()).toString();

  // Фильтры живут в URL, чтобы переживать refresh и возврат со страницы вариантов.
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
    queryKey: ['admin-products', { categoryId: categoryFilter, search, page }],
    queryFn: () =>
      listProducts({
        categoryId: categoryFilter ? Number(categoryFilter) : undefined,
        search: search || undefined,
        page,
        size: PAGE_SIZE,
      }),
    enabled: hasFilter,
  });

  function invalidate() {
    return queryClient.invalidateQueries({ queryKey: ['admin-products'] });
  }

  const createMutation = useMutation({ mutationFn: createProduct, onSuccess: invalidate });
  const updateMutation = useMutation({
    mutationFn: (vars: { id: number; body: ProductRequest }) => updateProduct(vars.id, vars.body),
    onSuccess: invalidate,
  });
  const deleteMutation = useMutation({ mutationFn: deleteProduct, onSuccess: invalidate });

  const [editing, setEditing] = useState<ProductResponse | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<ProductResponse | null>(null);

  function openCreate() {
    setEditing(null);
    setForm({ ...EMPTY_FORM, categoryId: categoryFilter });
    setModalOpen(true);
  }

  function openEdit(product: ProductResponse) {
    setEditing(product);
    setForm({
      name: product.name,
      slug: product.slug,
      description: product.description ?? '',
      categoryId: product.categoryId.toString(),
      brandId: product.brandId?.toString() ?? '',
    });
    setModalOpen(true);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const body: ProductRequest = {
      name: form.name,
      slug: form.slug,
      description: form.description || null,
      categoryId: Number(form.categoryId),
      brandId: form.brandId ? Number(form.brandId) : null,
    };
    const action = editing
      ? updateMutation.mutateAsync({ id: editing.id, body })
      : createMutation.mutateAsync(body);
    action.then(() => setModalOpen(false)).catch(() => {});
  }

  const activeMutation = editing ? updateMutation : createMutation;

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
              <col className="products-page__col--skus" />
              <col className="products-page__col--brand" />
              <col className="products-page__col--actions" />
            </colgroup>
            <thead>
              <tr>
                <th>ID</th>
                <th>Название</th>
                <th>Артикулы</th>
                <th>Бренд</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {pageData?.content.map((product) => (
                <tr key={product.id}>
                  <td className="mono-num">{product.id}</td>
                  <td>{product.name}</td>
                  <td className="mono-num">{product.skus.length > 0 ? product.skus.join(', ') : '—'}</td>
                  <td>{brands?.find((b) => b.id === product.brandId)?.name ?? '—'}</td>
                  <td>
                    <div className="admin-table__actions">
                      <Link href={`/admin/products/${product.id}/variants`} className="admin-table__link-btn">
                        Варианты
                      </Link>
                      <Link href={`/admin/products/${product.id}/images`} className="admin-table__link-btn">
                        Фото
                      </Link>
                      <button
                        type="button"
                        className="admin-table__icon-btn"
                        onClick={() => openEdit(product)}
                        aria-label="Редактировать"
                      >
                        <EditIcon width={16} height={16} />
                      </button>
                      <button
                        type="button"
                        className="admin-table__icon-btn admin-table__icon-btn--danger"
                        onClick={() => setDeleteTarget(product)}
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
          {!isLoading && pageData?.content.length === 0 && (
            <div className="admin-empty">{search ? 'Ничего не найдено.' : 'Товаров пока нет.'}</div>
          )}
        </div>
      )}

      {hasFilter && pageData && <Pagination page={page} totalPages={pageData.totalPages} onChange={setPage} />}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Редактировать товар' : 'Новый товар'}
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setModalOpen(false)}>
              Отмена
            </Button>
            <Button size="sm" onClick={handleSubmit} disabled={activeMutation.isPending || !form.categoryId}>
              Сохранить
            </Button>
          </>
        }
      >
        <form className="admin-form" onSubmit={handleSubmit}>
          {formError(activeMutation.error) && (
            <div className="admin-banner-error">{formError(activeMutation.error)}</div>
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
          <div className="admin-form-field">
            <label htmlFor="product-slug">Slug<RequiredMark /></label>
            <input
              id="product-slug"
              className="filter-text-input mono-num"
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
              required
            />
            {fieldError(activeMutation.error, 'slug') && (
              <span className="admin-form-error">{fieldError(activeMutation.error, 'slug')}</span>
            )}
          </div>
          <div className="admin-form-field">
            <label htmlFor="product-description">Описание</label>
            <textarea
              id="product-description"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>
          <div className="admin-form-row">
            <div className="admin-form-field">
              <label htmlFor="product-category">Категория<RequiredMark /></label>
              <Select
                id="product-category"
                options={categories?.map((c) => ({ value: String(c.id), label: c.name })) ?? []}
                value={form.categoryId}
                onChange={(value) => setForm((f) => ({ ...f, categoryId: value }))}
                placeholder="Выберите категорию"
                portal
              />
            </div>
            <div className="admin-form-field">
              <label htmlFor="product-brand">Бренд</label>
              <Select
                id="product-brand"
                options={[{ value: '', label: 'Без бренда' }, ...(brands?.map((b) => ({ value: String(b.id), label: b.name })) ?? [])]}
                value={form.brandId}
                onChange={(value) => setForm((f) => ({ ...f, brandId: value }))}
                portal
              />
            </div>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Удалить товар?"
        description={`Товар «${deleteTarget?.name}» и все его варианты будут удалены безвозвратно.`}
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
